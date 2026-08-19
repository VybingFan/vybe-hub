import { useCallback, useEffect, useState } from "react";
import { Boxes, CheckCircle2, Gamepad2, Loader2, PauseCircle, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLAY_GENRES } from "@/features/play/content";
import { HIP_HOP_STARTER_PACKS } from "@/features/play/content-packs/hipHopStarterPacks";
import { NON_MUSIC_PLAY_BLUEPRINTS } from "@/features/play/content-packs/nonMusicPlayBlueprints";
import {
  playGamePackService,
  type PlayGamePack,
  type PlayGamePackDraft,
  type PlayGamePackStatus,
  type PlayGameType,
  type PlayPackItemDraft,
} from "@/services/play/playGamePackService";

const GAME_TEMPLATES: Array<{
  type: PlayGameType;
  label: string;
  description: string;
}> = [
  { type: "beat_blitz", label: "Beat Blitz", description: "Timed multiple-choice trivia round" },
  {
    type: "vybe_match",
    label: "VYBE Match",
    description: "Match artists, eras, sounds, and facts",
  },
  { type: "hidden_gems", label: "Hidden Gems", description: "Clue-and-reveal discovery challenge" },
  {
    type: "daily_vybe",
    label: "Daily VYBE",
    description: "Short rotating question or discovery prompt",
  },
];

const emptyPack: PlayGamePackDraft = {
  pack_key: "",
  game_type: "beat_blitz",
  title: "",
  description: "",
  genre: "Mixed VYBE",
  focus_scope: "legacy",
  creator_focus: null,
  topic: "",
  game_style: "choice",
  artwork_url: null,
  discovery_url: null,
  featured: false,
  visibility: "public",
  scheduled_start_at: null,
  scheduled_end_at: null,
};

type BatchRow = Omit<PlayPackItemDraft, "game_pack_id" | "position"> & { position?: number };

export function PlayGamePackManager({
  canEdit,
  canPublish,
  onContentChanged,
  onSelectedPackChange,
}: {
  canEdit: boolean;
  canPublish: boolean;
  onContentChanged: () => void;
  onSelectedPackChange?: (pack: PlayGamePack | null) => void;
}) {
  const [packs, setPacks] = useState<PlayGamePack[]>([]);
  const [draft, setDraft] = useState<PlayGamePackDraft>(emptyPack);
  const [selected, setSelected] = useState<PlayGamePack | null>(null);
  const [itemCount, setItemCount] = useState<Record<string, number>>({});
  const [batchText, setBatchText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreateTools, setShowCreateTools] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await playGamePackService.list();
      setPacks(next);
      const counts = await Promise.all(
        next.map(
          async (pack) => [pack.id, (await playGamePackService.listItems(pack.id)).length] as const,
        ),
      );
      setItemCount(Object.fromEntries(counts));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Game packs could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function chooseTemplate(type: PlayGameType) {
    const template = GAME_TEMPLATES.find((entry) => entry.type === type)!;
    setDraft({
      ...emptyPack,
      game_type: type,
      title: template.label,
      description: template.description,
      game_style:
        type === "vybe_match"
          ? "match"
          : type === "hidden_gems"
            ? "clue_reveal"
            : type === "daily_vybe"
              ? "daily_prompt"
              : "choice",
    });
    setSelected(null);
    setShowCreateTools(true);
    onSelectedPackChange?.(null);
  }

  function editPack(pack: PlayGamePack) {
    setSelected(pack);
    setShowCreateTools(false);
    onSelectedPackChange?.(pack);
    setDraft({
      id: pack.id,
      pack_key: pack.pack_key,
      game_type: pack.game_type,
      title: pack.title,
      description: pack.description,
      genre: pack.genre,
      focus_scope: pack.focus_scope,
      creator_focus: pack.creator_focus,
      topic: pack.topic,
      game_style: pack.game_style,
      artwork_url: pack.artwork_url,
      discovery_url: pack.discovery_url,
      featured: pack.featured,
      visibility: pack.visibility,
      scheduled_start_at: pack.scheduled_start_at,
      scheduled_end_at: pack.scheduled_end_at,
    });
  }

  async function savePack() {
    if (!draft.pack_key.trim() || !draft.title.trim()) {
      toast.error("Pack key and title are required.");
      return;
    }
    setBusy(true);
    try {
      const saved = await playGamePackService.save({
        ...draft,
        pack_key: slug(draft.pack_key),
      });
      setSelected(saved);
      onSelectedPackChange?.(saved);
      editPack(saved);
      await load();
      toast.success(draft.id ? "Game pack updated." : "Ready game pack created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Game pack could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(pack: PlayGamePack, status: PlayGamePackStatus) {
    setBusy(true);
    try {
      const saved = await playGamePackService.setStatus(pack.id, status);
      setSelected(saved);
      onSelectedPackChange?.(saved);
      await load();
      toast.success(`Game pack changed to ${status.replaceAll("_", " ")}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Game pack status could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function importBatch() {
    if (!selected) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(batchText) as BatchRow[] | { items: BatchRow[] };
      const rows = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(rows) || !rows.length)
        throw new Error("The batch must contain an items array.");
      for (const [index, row] of rows.entries()) {
        if (!row.prompt || !row.title)
          throw new Error(`Item ${index + 1} needs a title and prompt.`);
        await playGamePackService.saveItem({
          ...row,
          id: row.id ?? null,
          game_pack_id: selected.id,
          position: row.position ?? index + 1,
          content_key: slug(row.content_key || `${selected.pack_key}-${index + 1}`),
          payload: row.payload ?? {},
          explanation: row.explanation ?? "",
          difficulty: row.difficulty ?? "intro",
          rights_status: row.rights_status ?? "not_required",
          source_title: row.source_title ?? null,
          source_url: row.source_url ?? null,
          verification_notes: row.verification_notes ?? "",
          discovery_url: row.discovery_url ?? null,
        });
      }
      setBatchText("");
      await load();
      onContentChanged();
      toast.success(`${rows.length} items added to ${selected.title}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The batch could not be imported.");
    } finally {
      setBusy(false);
    }
  }

  async function installStarter(packKey: string) {
    const starter = HIP_HOP_STARTER_PACKS.find((entry) => entry.pack_key === packKey);
    if (!starter) return;
    setBusy(true);
    try {
      const pack = await playGamePackService.save({
        pack_key: starter.pack_key,
        game_type: starter.game_type,
        title: starter.title,
        description: starter.description,
        genre: starter.genre,
        visibility: "public",
        scheduled_start_at: null,
        scheduled_end_at: null,
      });
      for (const [index, item] of starter.items.entries()) {
        await playGamePackService.saveItem({
          ...item,
          game_pack_id: pack.id,
          position: index + 1,
        });
      }
      setSelected(pack);
      onSelectedPackChange?.(pack);
      editPack(pack);
      await load();
      onContentChanged();
      toast.success(`${starter.title} installed with ${starter.items.length} editable items.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The starter pack could not be installed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function installBlueprint(packKey: string) {
    const blueprint = NON_MUSIC_PLAY_BLUEPRINTS.find((entry) => entry.pack_key === packKey);
    if (!blueprint) return;
    setBusy(true);
    try {
      const pack = await playGamePackService.save({
        ...blueprint,
        id: null,
        genre: "Mixed VYBE",
        visibility: "public",
        scheduled_start_at: null,
        scheduled_end_at: null,
      });
      setSelected(pack);
      onSelectedPackChange?.(pack);
      editPack(pack);
      await load();
      onContentChanged();
      toast.success(`${blueprint.title} draft created. Add verified content before review.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The game blueprint could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-primary" /> Game packs
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Select an existing game to manage its pack and content. Open Create / add game only when building something new.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {canEdit ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
            <div>
              <p className="font-semibold">Create / add game</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prepared games, blueprints, and blank formats stay out of the way until you need them.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateTools((current) => !current)}
            >
              {showCreateTools ? "Hide creation tools" : "Open creation tools"}
            </Button>
          </div>
        ) : null}

        {canEdit && showCreateTools ? (
          <div className="space-y-5 rounded-2xl border border-border p-5">
            <div>
              <p className="mb-3 text-sm font-semibold">Install a prepared hip-hop game</p>
              <div className="grid gap-3 lg:grid-cols-3">
                {HIP_HOP_STARTER_PACKS.map((starter) => (
                  <Button
                    key={starter.pack_key}
                    variant="outline"
                    className="h-auto justify-start p-4 text-left"
                    disabled={busy || packs.some((pack) => pack.pack_key === starter.pack_key)}
                    onClick={() => void installStarter(starter.pack_key)}
                  >
                    <span>
                      <span className="block font-semibold">{starter.title}</span>
                      <span className="mt-1 block whitespace-normal text-xs font-normal text-muted-foreground">
                        {starter.items.length} editable items | installs as draft
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Prepared non-music game blueprints</p>
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                Creates the structured draft and artwork assignment only. Add sourced, verified items before review.
              </p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {NON_MUSIC_PLAY_BLUEPRINTS.map((blueprint) => (
                  <Button
                    key={blueprint.pack_key}
                    variant="outline"
                    className="h-auto justify-start p-4 text-left"
                    disabled={busy || packs.some((pack) => pack.pack_key === blueprint.pack_key)}
                    onClick={() => void installBlueprint(blueprint.pack_key)}
                  >
                    <span>
                      <span className="block font-semibold">{blueprint.title}</span>
                      <span className="mt-1 block whitespace-normal text-xs font-normal text-muted-foreground">
                        {blueprint.creator_focus ?? "Cross-focus"} | {blueprint.topic} | {blueprint.game_style.replaceAll("_", " ")}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Or start another game format</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {GAME_TEMPLATES.map((template) => (
                  <Button
                    key={template.type}
                    variant="outline"
                    className="h-auto justify-start p-4 text-left"
                    onClick={() => chooseTemplate(template.type)}
                  >
                    <span>
                      <span className="block font-semibold">{template.label}</span>
                      <span className="mt-1 block whitespace-normal text-xs font-normal text-muted-foreground">
                        {template.description}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className={selected || showCreateTools ? "grid gap-6 xl:grid-cols-[1fr_1fr]" : "grid gap-6"}>
          <div className="space-y-3">
            {packs.length ? (
              packs.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => editPack(pack)}
                  className={`w-full rounded-2xl border p-4 text-left ${selected?.id === pack.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{pack.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pack.focus_scope === "cross_focus"
                          ? "Connect the VYBE"
                          : pack.creator_focus
                            ? pack.creator_focus.replaceAll("_", " ")
                            : pack.genre} | {itemCount[pack.id] ?? 0} items | v{pack.version}
                      </p>
                    </div>
                    <Badge variant={pack.status === "active" ? "default" : "outline"}>
                      {pack.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Select a format above to create the first ready game pack.
              </div>
            )}
          </div>

          {(selected || showCreateTools) ? (
          <div className="space-y-4 rounded-2xl border border-border p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pack key">
                <Input
                  value={draft.pack_key}
                  disabled={!canEdit}
                  placeholder="hip-hop-beat-blitz-01"
                  onChange={(event) => setDraft({ ...draft, pack_key: event.target.value })}
                />
              </Field>
              <Field label="Format">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.game_type}
                  disabled={!canEdit || Boolean(draft.id)}
                  onChange={(event) =>
                    setDraft({ ...draft, game_type: event.target.value as PlayGameType })
                  }
                >
                  {GAME_TEMPLATES.map((entry) => (
                    <option key={entry.type} value={entry.type}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Game title">
              <Input
                value={draft.title}
                disabled={!canEdit}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </Field>
            <Field label="Player description">
              <Textarea
                value={draft.description}
                disabled={!canEdit}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Focus scope">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.focus_scope}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const focus_scope = event.target.value as PlayGamePackDraft["focus_scope"];
                    setDraft({
                      ...draft,
                      focus_scope,
                      creator_focus:
                        focus_scope === "single_focus" ? draft.creator_focus ?? "music" : null,
                    });
                  }}
                >
                  <option value="legacy">Legacy / Music pilot</option>
                  <option value="single_focus">Single creator focus</option>
                  <option value="cross_focus">Cross-focus</option>
                </select>
              </Field>
              {draft.focus_scope === "single_focus" ? (
                <Field label="Creator Focus">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.creator_focus ?? "music"}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        creator_focus: event.target.value as NonNullable<PlayGamePackDraft["creator_focus"]>,
                      })
                    }
                  >
                    <option value="music">Music</option>
                    <option value="film">Film / Video</option>
                    <option value="acting">Acting</option>
                    <option value="theater">Theater</option>
                    <option value="comedy">Comedy</option>
                    <option value="podcasting">Podcasting</option>
                    <option value="writing">Writing / Poetry</option>
                    <option value="dance">Dance</option>
                    <option value="visual_art">Visual Art</option>
                  </select>
                </Field>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Topic / category">
                <Input
                  value={draft.topic}
                  disabled={!canEdit}
                  placeholder="Behind the Scenes"
                  onChange={(event) => setDraft({ ...draft, topic: event.target.value })}
                />
              </Field>
              <Field label="Game style">
                <Input
                  value={draft.game_style}
                  disabled={!canEdit}
                  placeholder="choice"
                  onChange={(event) => setDraft({ ...draft, game_style: event.target.value })}
                />
              </Field>
            </div>
            {(draft.focus_scope === "legacy" || draft.creator_focus === "music") ? (
              <Field label="Music genre">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.genre}
                  disabled={!canEdit}
                  onChange={(event) => setDraft({ ...draft, genre: event.target.value })}
                >
                  {PLAY_GENRES.map((genre) => (
                    <option key={genre}>{genre}</option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Artwork URL">
              <Input
                value={draft.artwork_url ?? ""}
                disabled={!canEdit}
                placeholder="/images/play/focus-packs/..."
                onChange={(event) =>
                  setDraft({ ...draft, artwork_url: event.target.value.trim() || null })
                }
              />
            </Field>
            <Field label="Pack discovery URL">
              <Input
                value={draft.discovery_url ?? ""}
                disabled={!canEdit}
                placeholder="/explore"
                onChange={(event) =>
                  setDraft({ ...draft, discovery_url: event.target.value.trim() || null })
                }
              />
            </Field>
            <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                disabled={!canEdit}
                onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
              />
              Feature this game pack
            </label>
            {canEdit ? (
              <Button onClick={() => void savePack()} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Save game pack
              </Button>
            ) : null}

            {selected && canEdit ? (
              <div className="space-y-3 border-t border-border pt-4">
                <Field
                  label="Load a prepared batch"
                  hint="Paste the prepared JSON batch. Every item remains editable in the content inventory."
                >
                  <Textarea
                    rows={7}
                    value={batchText}
                    onChange={(event) => setBatchText(event.target.value)}
                    placeholder={
                      '{"items":[{"content_key":"...","title":"...","prompt":"...","payload":{"choices":["A","B"],"answer":"A"},"source_title":"..."}]}'
                    }
                  />
                </Field>
                <Button
                  variant="outline"
                  onClick={() => void importBatch()}
                  disabled={busy || !batchText.trim()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Insert complete batch
                </Button>
              </div>
            ) : null}

            {selected && (canEdit || canPublish) ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {canEdit && selected.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void changeStatus(selected, "review_needed")}
                  >
                    Send pack to review
                  </Button>
                ) : null}
                {canPublish && selected.status === "review_needed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void changeStatus(selected, "approved")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve pack
                  </Button>
                ) : null}
                {canPublish && ["approved", "paused"].includes(selected.status) ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void changeStatus(selected, "active")}
                  >
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Publish pack
                  </Button>
                ) : null}
                {canPublish && selected.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void changeStatus(selected, "paused")}
                  >
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Pause to edit
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}
