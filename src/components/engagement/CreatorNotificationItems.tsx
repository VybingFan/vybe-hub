import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { CreatorNotification } from "@/services/engagement/creatorEngagementService";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "V";
}

function message(item: CreatorNotification) {
  const name = item.actor_username ? `@${item.actor_username}` : item.actor_display_name;
  const track = typeof item.payload?.track_title === "string" ? item.payload.track_title : "your song";
  const preview = typeof item.payload?.preview === "string" ? item.payload.preview : "";
  if (item.notification_type === "new_follower") return `${name} followed you.`;
  if (item.notification_type === "track_like") return `${name} liked ${track}.`;
  if (item.notification_type === "track_save") return `${name} saved ${track}.`;
  if (item.notification_type === "new_comment") return `${name} commented${preview ? `: “${preview}”` : "."}`;
  return `${name} interacted with your VYBE.`;
}

export function CreatorNotificationItems({ items }: { items: CreatorNotification[] }) {
  return (
    <>
      {items.slice(0, 8).map((item) => (
        <DropdownMenuItem key={item.id} className="items-start gap-3 py-3">
          <Avatar className="mt-0.5 h-8 w-8 shrink-0">
            {item.signed_avatar_url ? <AvatarImage src={item.signed_avatar_url} /> : null}
            <AvatarFallback className="text-xs">{initials(item.actor_display_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium">{message(item)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
              {!item.read_at ? " · New" : ""}
            </p>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}
