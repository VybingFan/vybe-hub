import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LockedFeatureLearnMoreDialog } from "@/components/membership/LockedFeatureLearnMoreDialog";
import { CREATOR_PLAN_CATALOG, type PublicCreatorPlanCode } from "@/features/membership/catalog";
import { LOCKED_FEATURE_EDUCATION, type LockedFeatureEducationKey } from "@/features/membership/lockedFeatureEducation";

export function LockedFeatureCard({ title, description, requiredPlan, educationKey, usage, children, compact = false }: {
  title: string;
  description: string;
  requiredPlan: PublicCreatorPlanCode;
  educationKey?: LockedFeatureEducationKey;
  usage?: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  const plan = CREATOR_PLAN_CATALOG.find((item) => item.code === requiredPlan);
  const education = educationKey ? LOCKED_FEATURE_EDUCATION[educationKey] : null;
  return <Card className="border-primary/25 bg-gradient-to-br from-primary/5 via-background to-violet-500/5"><CardContent className={compact ? "p-4" : "p-5"}><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4 text-primary" />{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p>{usage && <p className="mt-2 text-xs font-medium text-primary">{usage}</p>}{children}</div><div className="flex shrink-0 flex-wrap gap-2">{education ? <LockedFeatureLearnMoreDialog triggerLabel="Learn how this helps" title={education.title} description={education.description} howItWorks={education.howItWorks} benefits={education.benefits} requiredPlanLabel={education.requiredPlanLabel} compact /> : null}<Button asChild size={compact ? "sm" : "default"} variant={education ? "outline" : "default"}><Link to="/creator-memberships">Compare plans</Link></Button></div></div></CardContent></Card>;
}
