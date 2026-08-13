import type { PublicCreatorPlanCode } from "@/features/membership/catalog";
import type { CreatorDiscipline } from "@/features/playlists/mixedMedia";

export interface CreatorDisciplineAllowance {
  plan_code: PublicCreatorPlanCode | "founding_beta";
  discipline: Exclude<CreatorDiscipline, "multidisciplinary">;
  public_identity_label: string;
  project_limit: number;
  published_project_limit: number;
  external_media_link_limit: number;
  hosted_media_minutes: number;
  private_review_playlist_limit: number;
  private_screener_limit: number;
  team_seat_limit: number;
  private_media_enabled: boolean;
  commercial_distribution_enabled: boolean;
  notes: string;
}

/**
 * Prices remain defined by the shared creator plan catalog. This type describes
 * discipline-specific features and usage only.
 */
export function allowanceKey(
  planCode: CreatorDisciplineAllowance["plan_code"],
  discipline: CreatorDisciplineAllowance["discipline"],
) {
  return `${planCode}:${discipline}` as const;
}

