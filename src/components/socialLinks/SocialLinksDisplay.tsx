import { Globe, Instagram, Facebook, Youtube, Music, Twitter, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOCIAL_FIELDS, type CreatorProfile, type SocialFieldKey } from "@/features/profile/schema";

const ICONS: Record<SocialFieldKey | "website", typeof Globe> = {
  website: Globe,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music,
  youtube: Youtube,
  spotify: Music,
  apple_music: Music,
  x: Twitter,
};

function toHref(key: SocialFieldKey | "website", raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "");
  switch (key) {
    case "instagram": return `https://instagram.com/${handle}`;
    case "facebook": return `https://facebook.com/${handle}`;
    case "tiktok": return `https://tiktok.com/@${handle}`;
    case "youtube": return `https://youtube.com/${handle}`;
    case "spotify": return `https://open.spotify.com/${handle}`;
    case "apple_music": return `https://music.apple.com/${handle}`;
    case "x": return `https://x.com/${handle}`;
    default: return `https://${raw}`;
  }
}

interface Props {
  profile: Partial<CreatorProfile>;
}

export function SocialLinksDisplay({ profile }: Props) {
  const items: { key: SocialFieldKey | "website"; label: string; value: string }[] = [];
  if (profile.website) items.push({ key: "website", label: "Website", value: profile.website });
  for (const f of SOCIAL_FIELDS) {
    const v = profile[f.key];
    if (v) items.push({ key: f.key, label: f.label, value: v });
  }
  const personal = profile.personal_links ?? [];

  if (items.length === 0 && personal.length === 0) {
    return <p className="text-sm text-muted-foreground">No links added yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, value }) => {
        const Icon = ICONS[key];
        return (
          <Button key={key} asChild variant="outline" size="sm" className="gap-2">
            <a href={toHref(key, value)} target="_blank" rel="noreferrer noopener">
              <Icon className="h-4 w-4" />
              {label}
            </a>
          </Button>
        );
      })}
      {personal.map((link, i) => (
        <Button key={`p-${i}`} asChild variant="outline" size="sm" className="gap-2">
          <a href={link.url} target="_blank" rel="noreferrer noopener">
            <ExternalLink className="h-4 w-4" />
            {link.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
