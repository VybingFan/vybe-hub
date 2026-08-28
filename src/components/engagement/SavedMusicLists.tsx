import { useEffect, useState } from "react";
import { Bookmark, Loader2, Music2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SharedPlaylistPlayer } from "@/components/playlists/SharedPlaylistPlayer";
import { getActiveIdentity } from "@/components/identity/IdentityModeBar";
import { savedMusicService, type SupporterMusicList } from "@/services/engagement/savedMusicService";

export function SavedMusicLists() {
  const [lists, setLists] = useState<SupporterMusicList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const identity = getActiveIdentity();
      if (!identity || identity.identity_type !== "supporter") {
        setLists([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try { setLists(await savedMusicService.lists()); }
      finally { setLoading(false); }
    };
    void load();
    window.addEventListener("vybe:identity-changed", load);
    return () => window.removeEventListener("vybe:identity-changed", load);
  }, []);

  if (loading) return <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Saved music</p>
        <h2 className="mt-1 text-2xl font-semibold">Your private song lists</h2>
        <p className="mt-1 text-sm text-muted-foreground">Songs you save stay private unless a future sharing option is deliberately enabled.</p>
      </div>
      {lists.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3"><Bookmark className="h-5 w-5 text-primary" /><div><h3 className="font-semibold">{list.name}</h3><p className="text-xs text-muted-foreground">{list.supporter_music_list_items?.length ?? 0} saved song(s)</p></div></div>
                <div className="mt-4 divide-y rounded-xl border">
                  {(list.supporter_music_list_items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      <Music2 className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.tracks?.title ?? "Saved song"}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.tracks?.primary_artist_name ?? "VYBE creator"}</p>
                      </div>
                      {(item.tracks?.playback_available ?? Boolean(item.tracks?.audio_url)) ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setActiveListId(list.id); setSelectedTrackId(item.track_id); }}>
                          <Play className="mr-2 h-4 w-4" /> Play
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                    </div>
                  ))}
                  {!list.supporter_music_list_items?.length ? <p className="p-3 text-sm text-muted-foreground">No songs saved yet.</p> : null}
                </div>
                {activeListId === list.id ? (
                  <div className="mt-5">
                    <SharedPlaylistPlayer
                      tracks={(list.supporter_music_list_items ?? []).map((item) => item.tracks).filter((track): track is NonNullable<typeof track> => Boolean(track))}
                      initialTrackId={selectedTrackId ?? undefined}
                      queueLabel={`Up next in ${list.name}`}
                      resolvePlaybackUrl={(track) => savedMusicService.playbackUrl(track.id)}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <Card><CardContent className="p-6 text-sm text-muted-foreground">Heart or save a public song from a creator page to begin.</CardContent></Card>}
    </section>
  );
}
