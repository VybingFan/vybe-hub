import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  FileAudio,
  FileImage,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/useUser";
import { EpkTierNotice } from "@/components/membership/EpkTierNotice";
import {
  creatorEpkService,
  type CreatorEpkWorkspace,
  type EpkAsset,
} from "@/services/creator/creatorEpkService";

export const Route = createFileRoute("/_authenticated/epk")({ component: CreatorEpkPage });

type Tab = "overview" | "professional" | "media" | "music" | "press";

const emptyWorkspace: CreatorEpkWorkspace = {
  epk: null,
  creator: null,
  tracks: [],
  lyrics: [],
  assets: [],
  masters: [],
  credits: [],
  featuredTracks: [],
  highlights: [],
};

function CreatorEpkPage() {
  return (
    <RoleGuard allow={["creator", "admin"]}>
      <CreatorEpkWorkspacePage />
    </RoleGuard>
  );
}

function CreatorEpkWorkspacePage() {
  const { user } = useUser();
  const creatorId = user?.id;
  const [data, setData] = useState(emptyWorkspace);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    if (!creatorId) return;
    setLoading(true);
    try {
      setData(await creatorEpkService.load(creatorId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load your Industry Kit.");
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => void load(), [load]);

  const readiness = useMemo(() => calculateReadiness(data), [data]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary"><BriefcaseBusiness className="h-4 w-4" /> Creator professional tools</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Industry Kit & EPK</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Build one professional source for booking, press, playlist pitching, and industry opportunities. VYBE starts with information already in your profile and music library.</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
          <p className="text-3xl font-semibold text-primary">{readiness.percent}%</p>
          <p className="text-xs text-muted-foreground">EPK readiness · {readiness.complete}/{readiness.total} areas</p>
        </div>
      </header>

      <EpkTierNotice />

      <div className="flex flex-wrap gap-2">
        {([
          ["overview", "Overview"], ["professional", "Bio & contacts"], ["media", "Media & brand"], ["music", "Music & credits"], ["press", "Press & milestones"],
        ] as [Tab, string][]).map(([value, label]) => (
          <Button key={value} type="button" variant={tab === value ? "default" : "outline"} onClick={() => setTab(value)}>{label}</Button>
        ))}
      </div>

      {tab === "overview" && <Overview data={data} readiness={readiness} onOpen={setTab} />}
      {tab === "professional" && creatorId && <ProfessionalForm creatorId={creatorId} data={data} onSaved={load} />}
      {tab === "media" && creatorId && <MediaWorkspace creatorId={creatorId} data={data} onChanged={load} />}
      {tab === "music" && creatorId && <MusicWorkspace creatorId={creatorId} data={data} onChanged={load} />}
      {tab === "press" && creatorId && <PressWorkspace creatorId={creatorId} data={data} onChanged={load} />}
    </div>
  );
}

function Overview({ data, readiness, onOpen }: { data: CreatorEpkWorkspace; readiness: ReturnType<typeof calculateReadiness>; onOpen: (tab: Tab) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <Card><CardHeader><CardTitle>EPK readiness checklist</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
        {readiness.items.map((item) => (
          <button key={item.label} type="button" onClick={() => onOpen(item.tab)} className="flex items-start gap-3 rounded-xl border border-border/70 p-4 text-left transition hover:border-primary/50">
            <span className={`mt-0.5 rounded-full p-1 ${item.done ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}><Check className="h-4 w-4" /></span>
            <span><span className="block font-medium">{item.label}</span><span className="text-xs text-muted-foreground">{item.detail}</span></span>
          </button>
        ))}
      </CardContent></Card>
      <div className="space-y-5">
        <Card><CardHeader><CardTitle>Already supplied by VYBE</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground">
          <SourceLine label="Artist identity" value={data.creator?.artist_name || data.creator?.display_name} />
          <SourceLine label="Genres" value={data.creator?.genres?.join(", ")} />
          <SourceLine label="Location" value={data.creator?.location} />
          <SourceLine label="Social and streaming links" value={hasSocial(data) ? "Connected" : "Needs attention"} />
          <SourceLine label="Music library" value={`${data.tracks.length} track${data.tracks.length === 1 ? "" : "s"}`} />
          <SourceLine label="Lyrics" value={`${data.lyrics.filter((item) => item.refined_lyrics.trim()).length} completed`} />
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Publication status</CardTitle></CardHeader><CardContent>
          <p className="text-sm text-muted-foreground">Your EPK remains private while it is being assembled. Public and secure share links will be added only after the creator preview is approved.</p>
          <div className="mt-4 flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /><span className="font-medium capitalize">{data.epk?.status ?? "draft"} · {data.epk?.visibility ?? "private"}</span></div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function ProfessionalForm({ creatorId, data, onSaved }: { creatorId: string; data: CreatorEpkWorkspace; onSaved: () => Promise<void> }) {
  const sourceBio = data.creator?.bio ?? "";
  const epk = data.epk;
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    try {
      await creatorEpkService.saveProfile(creatorId, {
        status: epk?.status ?? "draft", visibility: epk?.visibility ?? "private", slug: epk?.slug ?? null,
        short_bio: text("short_bio"), medium_bio: text("medium_bio"), long_bio: text("long_bio"),
        business_email: text("business_email"), booking_email: text("booking_email"), booking_phone: text("booking_phone"), booking_contact_name: text("booking_contact_name"),
        management_name: text("management_name"), management_email: text("management_email"), publicist_name: text("publicist_name"), publicist_email: text("publicist_email"),
        bandcamp_url: text("bandcamp_url"), primary_color: text("primary_color"), secondary_color: text("secondary_color"), accent_color: text("accent_color"),
        public_business_email: form.get("public_business_email") === "on", public_booking_email: form.get("public_booking_email") === "on", public_booking_phone: form.get("public_booking_phone") === "on",
        public_management_contact: form.get("public_management_contact") === "on", public_publicist_contact: form.get("public_publicist_contact") === "on",
      });
      await onSaved(); toast.success("Professional information saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save EPK information."); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="space-y-5">
    <Card><CardHeader><CardTitle>Artist biographies</CardTitle><p className="text-sm text-muted-foreground">Your existing profile bio is used as a starting point. Editing these versions does not overwrite your public VYBE profile.</p></CardHeader><CardContent className="space-y-4">
      <TextField name="short_bio" label="Short bio · approximately 50 words" defaultValue={epk?.short_bio || sourceBio} rows={3} maxLength={1000} />
      <TextField name="medium_bio" label="Medium bio · approximately 150 words" defaultValue={epk?.medium_bio || sourceBio} rows={6} maxLength={3000} />
      <TextField name="long_bio" label="Long biography" defaultValue={epk?.long_bio || sourceBio} rows={10} maxLength={10000} />
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Professional and booking contacts</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <InputField name="business_email" label="Professional business email" defaultValue={epk?.business_email} type="email" />
      <InputField name="booking_email" label="Booking email" defaultValue={epk?.booking_email} type="email" />
      <InputField name="booking_contact_name" label="Booking contact name" defaultValue={epk?.booking_contact_name} />
      <InputField name="booking_phone" label="Booking phone" defaultValue={epk?.booking_phone} type="tel" />
      <InputField name="management_name" label="Manager or management company" defaultValue={epk?.management_name} />
      <InputField name="management_email" label="Management email" defaultValue={epk?.management_email} type="email" />
      <InputField name="publicist_name" label="Publicist name" defaultValue={epk?.publicist_name} />
      <InputField name="publicist_email" label="Publicist email" defaultValue={epk?.publicist_email} type="email" />
      <InputField name="bandcamp_url" label="Bandcamp artist link" defaultValue={epk?.bandcamp_url} type="url" />
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Brand colors</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">
      <ColorField name="primary_color" label="Primary" defaultValue={epk?.primary_color} />
      <ColorField name="secondary_color" label="Secondary" defaultValue={epk?.secondary_color} />
      <ColorField name="accent_color" label="Accent" defaultValue={epk?.accent_color} />
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Contact visibility</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
      <CheckField name="public_business_email" label="Show business email" defaultChecked={epk?.public_business_email} />
      <CheckField name="public_booking_email" label="Show booking email" defaultChecked={epk?.public_booking_email ?? true} />
      <CheckField name="public_booking_phone" label="Show booking phone" defaultChecked={epk?.public_booking_phone} />
      <CheckField name="public_management_contact" label="Show management contact" defaultChecked={epk?.public_management_contact} />
      <CheckField name="public_publicist_contact" label="Show publicist contact" defaultChecked={epk?.public_publicist_contact} />
    </CardContent></Card>
    <div className="flex justify-end"><Button disabled={saving} type="submit"><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save professional information"}</Button></div>
  </form>;
}

function MediaWorkspace({ creatorId, data, onChanged }: { creatorId: string; data: CreatorEpkWorkspace; onChanged: () => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const file = values.get("file");
    if (!(file instanceof File) || !file.size) return toast.error("Choose a file.");
    setUploading(true);
    try {
      await creatorEpkService.uploadAsset(creatorId, file, { asset_type: String(values.get("asset_type")), orientation: String(values.get("orientation")) || null, title: String(values.get("title")), caption: "", alt_text: String(values.get("alt_text")) });
      form.reset(); await onChanged(); toast.success("EPK asset uploaded.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); }
  };
  return <div className="space-y-5"><Card><CardHeader><CardTitle>Upload press and brand assets</CardTitle><p className="text-sm text-muted-foreground">Add 3–5 high-resolution press photos, a logo, show flyers, and a PDF tech rider. Files remain private during this build.</p></CardHeader><CardContent><form onSubmit={upload} className="grid gap-4 md:grid-cols-2">
    <SelectField name="asset_type" label="Asset type" options={[['press_photo','Press photo'],['logo','Logo'],['show_flyer','Show flyer'],['tech_rider','Tech rider'],['press_document','Press document']]} />
    <SelectField name="orientation" label="Orientation" options={[['horizontal','Horizontal'],['vertical','Vertical'],['square','Square'],['document','Document']]} />
    <InputField name="title" label="Title" /> <InputField name="alt_text" label="Image description" />
    <div className="md:col-span-2"><Label htmlFor="epk-file">File</Label><Input id="epk-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf" required /></div>
    <div className="md:col-span-2"><Button disabled={uploading} type="submit"><FileImage className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : "Upload asset"}</Button></div>
  </form></CardContent></Card>
  <Card><CardHeader><CardTitle>Media library</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{data.assets.length ? data.assets.map((asset) => <AssetRow key={asset.id} asset={asset} onChanged={onChanged} />) : <p className="text-sm text-muted-foreground">No EPK media uploaded yet.</p>}</CardContent></Card></div>;
}

function AssetRow({ asset, onChanged }: { asset: EpkAsset; onChanged: () => Promise<void> }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = asset.content_type.startsWith("image/");
  useEffect(() => {
    let active = true;
    if (!isImage) return;
    void creatorEpkService
      .assetUrl(asset)
      .then((url) => active && setPreviewUrl(url))
      .catch(() => active && setPreviewUrl(null));
    return () => { active = false; };
  }, [asset, isImage]);
  const remove = async () => { if (!window.confirm(`Remove ${asset.original_filename}?`)) return; try { await creatorEpkService.deleteAsset(asset); await onChanged(); toast.success("Asset removed."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not remove asset."); } };
  const open = async () => { try { window.open(await creatorEpkService.assetUrl(asset), "_blank", "noopener,noreferrer"); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not open asset."); } };
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3"><button type="button" onClick={open} className="flex min-w-0 items-center gap-3 text-left">{previewUrl ? <img src={previewUrl} alt={asset.alt_text || asset.title || asset.original_filename} className="h-20 w-20 shrink-0 rounded-lg border border-border/70 object-cover" /> : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted"><FileImage className="h-7 w-7 text-muted-foreground" /></span>}<span className="min-w-0"><span className="block truncate font-medium">{asset.title || asset.original_filename}</span><span className="block text-xs capitalize text-muted-foreground">{asset.asset_type.replaceAll("_", " ")} · {asset.orientation ?? "unspecified"}</span><span className="mt-1 block text-xs text-primary">Open full file</span></span></button><Button type="button" size="icon" variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button></div>;
}

function MusicWorkspace({ creatorId, data, onChanged }: { creatorId: string; data: CreatorEpkWorkspace; onChanged: () => Promise<void> }) {
  const selected = new Set(data.featuredTracks.map((item) => item.track_id));
  const toggle = async (trackId: string, checked: boolean) => { try { await creatorEpkService.setFeaturedTrack(creatorId, trackId, checked, { spotify_url: data.creator?.spotify ?? "", apple_music_url: data.creator?.apple_music ?? "", bandcamp_url: data.epk?.bandcamp_url ?? "" }); await onChanged(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update featured music."); } };
  const addCredit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); try { await creatorEpkService.addCredit({ creator_id: creatorId, track_id: String(values.get("track_id")), credit_role: String(values.get("credit_role")), credited_name: String(values.get("credited_name")), details: String(values.get("details")) }); form.reset(); await onChanged(); toast.success("Credit added."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add credit."); } };
  const uploadMaster = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const file = values.get("master"); if (!(file instanceof File) || !file.size) return toast.error("Choose a WAV master."); try { await creatorEpkService.uploadMaster(creatorId, String(values.get("track_id")), file); form.reset(); await onChanged(); toast.success("WAV master uploaded."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not upload master."); } };
  return <div className="space-y-5"><Card><CardHeader><CardTitle>Featured EPK music</CardTitle><p className="text-sm text-muted-foreground">Select your strongest tracks. Existing titles, artists, artwork, lyrics, and profile-level streaming links are reused automatically.</p></CardHeader><CardContent className="space-y-3">{data.tracks.length ? data.tracks.map((track) => <label key={track.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-border/70 p-4"><span><span className="block font-medium">{track.title}</span><span className="text-xs text-muted-foreground">{track.primary_artist_name} · {track.genre || "Genre not set"} · {track.status}</span></span><input type="checkbox" checked={selected.has(track.id)} onChange={(event) => void toggle(track.id, event.target.checked)} className="h-5 w-5 accent-primary" /></label>) : <p className="text-sm text-muted-foreground">Upload music before selecting EPK tracks.</p>}</CardContent></Card>
  <div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Full song credits</CardTitle></CardHeader><CardContent><form onSubmit={addCredit} className="space-y-3"><TrackSelect tracks={data.tracks} /><SelectField name="credit_role" label="Credit role" options={[['writer','Writer'],['producer','Producer'],['featured_artist','Featured artist'],['performer','Performer'],['engineer','Engineer'],['mixer','Mixer'],['mastering','Mastering'],['publisher','Publisher'],['label','Label'],['other','Other']]} /><InputField name="credited_name" label="Credited name" required /><InputField name="details" label="Details (optional)" /><Button type="submit"><Plus className="mr-2 h-4 w-4" />Add credit</Button></form><div className="mt-5 space-y-2">{data.credits.map((credit) => <div key={credit.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span><b>{credit.credited_name}</b> · {credit.credit_role.replaceAll('_',' ')}</span><Button type="button" size="icon" variant="ghost" onClick={async () => { await creatorEpkService.deleteCredit(credit.id); await onChanged(); }}><Trash2 className="h-4 w-4" /></Button></div>)}</div></CardContent></Card>
  <Card><CardHeader><CardTitle>WAV audio masters</CardTitle><p className="text-sm text-muted-foreground">Keep an uncompressed WAV ready for press, radio, licensing, and professional requests. Masters remain private.</p></CardHeader><CardContent><form onSubmit={uploadMaster} className="space-y-3"><TrackSelect tracks={data.tracks} /><div><Label htmlFor="master-file">WAV file</Label><Input id="master-file" name="master" type="file" accept="audio/wav,audio/x-wav,.wav" required /></div><Button type="submit"><FileAudio className="mr-2 h-4 w-4" />Upload WAV master</Button></form><div className="mt-5 space-y-2">{data.masters.map((master) => <p key={master.id} className="rounded-lg border p-3 text-sm">{data.tracks.find((track) => track.id === master.track_id)?.title ?? "Track"} · {master.original_filename}</p>)}</div></CardContent></Card></div></div>;
}

function PressWorkspace({ creatorId, data, onChanged }: { creatorId: string; data: CreatorEpkWorkspace; onChanged: () => Promise<void> }) {
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); try { await creatorEpkService.addHighlight({ creator_id: creatorId, highlight_type: String(values.get("highlight_type")), title: String(values.get("title")), source_name: String(values.get("source_name")), source_url: String(values.get("source_url")), quote_text: String(values.get("quote_text")), occurred_on: String(values.get("occurred_on")) || null }); form.reset(); await onChanged(); toast.success("Press highlight added."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add highlight."); } };
  return <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><Card><CardHeader><CardTitle>Add a press highlight or milestone</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-3"><SelectField name="highlight_type" label="Type" options={[['press_quote','Press quote'],['playlist_placement','Playlist placement'],['radio','Radio'],['show','Notable show'],['award','Award'],['milestone','Milestone'],['other','Other']]} /><InputField name="title" label="Title" required /><InputField name="source_name" label="Publication, playlist, venue, or source" /><InputField name="source_url" label="Source link" type="url" /><InputField name="occurred_on" label="Date" type="date" /><TextField name="quote_text" label="Quote or details" rows={4} /><Button type="submit"><Plus className="mr-2 h-4 w-4" />Add highlight</Button></form></CardContent></Card><Card><CardHeader><CardTitle>Press and career record</CardTitle></CardHeader><CardContent className="space-y-3">{data.highlights.length ? data.highlights.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 p-4"><div><p className="font-medium">{item.title}</p><p className="text-xs capitalize text-primary">{item.highlight_type.replaceAll('_',' ')}</p>{item.source_name && <p className="mt-2 text-sm text-muted-foreground">{item.source_name}</p>}{item.quote_text && <p className="mt-2 text-sm">{item.quote_text}</p>}</div><Button type="button" size="icon" variant="ghost" onClick={async () => { await creatorEpkService.deleteHighlight(item.id); await onChanged(); }}><Trash2 className="h-4 w-4" /></Button></div>) : <p className="text-sm text-muted-foreground">Add reviews, playlist placements, notable shows, awards, and career milestones.</p>}</CardContent></Card></div>;
}

function calculateReadiness(data: CreatorEpkWorkspace) {
  const photos = data.assets.filter((item) => item.asset_type === "press_photo").length;
  const items: { label: string; detail: string; done: boolean; tab: Tab }[] = [
    { label: "Creator identity", detail: "Artist name, username, genres, and location", done: !!(data.creator?.artist_name && data.creator?.username && data.creator?.genres?.length), tab: "professional" },
    { label: "Three biography lengths", detail: "Short, medium, and long versions", done: !!(data.epk?.short_bio && data.epk?.medium_bio && data.epk?.long_bio), tab: "professional" },
    { label: "Booking contact", detail: "Professional booking email or contact", done: !!data.epk?.booking_email, tab: "professional" },
    { label: "Social and music links", detail: "Website, social platforms, and streaming", done: hasSocial(data) && !!(data.creator?.spotify || data.creator?.apple_music || data.epk?.bandcamp_url), tab: "professional" },
    { label: "Brand identity", detail: "Logo and brand colors", done: data.assets.some((item) => item.asset_type === "logo") && !!data.epk?.primary_color, tab: "media" },
    { label: "Press photography", detail: `${photos}/3 minimum photos`, done: photos >= 3, tab: "media" },
    { label: "Featured music", detail: "Selected tracks for the EPK", done: data.featuredTracks.length > 0, tab: "music" },
    { label: "Lyrics and credits", detail: "Reviewed lyrics and structured song credits", done: data.lyrics.some((item) => item.refined_lyrics.trim()) && data.credits.length > 0, tab: "music" },
    { label: "WAV masters", detail: "At least one uncompressed master", done: data.masters.length > 0, tab: "music" },
    { label: "Technical rider", detail: "Live sound and stage requirements", done: data.assets.some((item) => item.asset_type === "tech_rider"), tab: "media" },
    { label: "Press and milestones", detail: "Reviews, placements, shows, or achievements", done: data.highlights.length > 0, tab: "press" },
  ];
  const complete = items.filter((item) => item.done).length;
  return { items, complete, total: items.length, percent: Math.round((complete / items.length) * 100) };
}

function hasSocial(data: CreatorEpkWorkspace) { const p = data.creator; return !!(p?.website || p?.instagram || p?.tiktok || p?.youtube || p?.facebook || p?.x); }
function SourceLine({ label, value }: { label: string; value?: string | null }) { return <div className="flex items-center justify-between gap-4 border-b border-border/50 py-2 last:border-0"><span>{label}</span><span className="text-right font-medium text-foreground">{value || "Not added"}</span></div>; }
function InputField({ name, label, defaultValue, type = "text", required = false }: { name: string; label: string; defaultValue?: string | null; type?: string; required?: boolean }) { return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} /></div>; }
function TextField({ name, label, defaultValue, rows = 3, maxLength }: { name: string; label: string; defaultValue?: string | null; rows?: number; maxLength?: number }) { return <div><Label htmlFor={name}>{label}</Label><Textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={rows} maxLength={maxLength} /></div>; }
function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) { return <div><Label htmlFor={name}>{label}</Label><div className="flex gap-2"><Input type="color" className="h-10 w-14 p-1" defaultValue={defaultValue || "#7c3aed"} /><Input id={name} name={name} placeholder="#7C3AED" defaultValue={defaultValue ?? ""} pattern="#[0-9A-Fa-f]{6}" /></div></div>; }
function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) { return <label className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-sm"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-primary" />{label}</label>; }
function SelectField({ name, label, options }: { name: string; label: string; options: [string, string][] }) { return <div><Label htmlFor={name}>{label}</Label><select id={name} name={name} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>; }
function TrackSelect({ tracks }: { tracks: CreatorEpkWorkspace["tracks"] }) { return <SelectField name="track_id" label="Track" options={tracks.map((track) => [track.id, track.title])} />; }

