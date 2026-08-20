import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getActiveIdentity } from "@/components/identity/IdentityModeBar";

type PublicComment = {
  id: string;
  body: string;
  created_at: string;
  identity_id: string;
  display_name: string;
  username: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  signed_avatar_url?: string | null;
};

async function hydrateAvatar(comment: PublicComment): Promise<PublicComment> {
  if (!comment.avatar_path) return comment;
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(comment.avatar_path, 60 * 60 * 6);
  return { ...comment, signed_avatar_url: data?.signedUrl || comment.avatar_url };
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "V";
}

export function CreatorComments({ entityId }: { entityId: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [body, setBody] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    void (async () => {
      const { data, error } = await (supabase.rpc as any)(
        "get_public_creator_comments",
        { p_creator_user_id: entityId },
      );
      if (error) {
        setComments([]);
        return;
      }
      setComments(await Promise.all((data || []).map(hydrateAvatar)));
    })();
  }, [entityId, refresh]);

  const post = async () => {
    const identity = getActiveIdentity();
    if (!identity || identity.identity_type !== "supporter") {
      toast.error("Switch to Supporter Mode to comment.");
      return;
    }
    if (!body.trim()) return;
    const { error } = await (supabase.from("identity_comments") as any).insert({
      identity_id: identity.id,
      entity_type: "creator_profile",
      entity_id: entityId,
      body: body.trim(),
    });
    if (error) toast.error(error.message);
    else {
      setBody("");
      setRefresh((value) => value + 1);
      toast.success("Comment posted");
    }
  };

  return (
    <section className="mx-auto -mt-2 max-w-7xl px-6 pb-32 sm:-mt-3">
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center text-xl font-semibold">
          <MessageCircle className="mr-2 h-5 w-5" />
          Conversation
        </h2>
        <div className="mt-4 flex gap-2">
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            placeholder="Add a comment as a supporter"
          />
          <Button onClick={() => void post()}>Post</Button>
        </div>
        <div className="mt-4 max-h-[18rem] space-y-3 overflow-y-auto overscroll-contain pr-2 pb-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 rounded-xl bg-muted/50 p-3">
              <Avatar className="h-9 w-9 shrink-0">
                {(comment.signed_avatar_url || comment.avatar_url) ? (
                  <AvatarImage
                    src={comment.signed_avatar_url || comment.avatar_url || undefined}
                    alt={`${comment.display_name} profile photo`}
                  />
                ) : null}
                <AvatarFallback>{initials(comment.display_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{comment.display_name}</span>
                  {comment.username ? (
                    <span className="text-xs text-muted-foreground">@{comment.username}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
              </div>
            </div>
          ))}
          {!comments.length ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
