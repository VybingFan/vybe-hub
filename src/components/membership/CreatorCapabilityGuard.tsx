import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import type { PublicCreatorPlanCode } from "@/features/membership/catalog";
import { hasCreatorCapability, type CreatorCapability } from "@/features/membership/access";
import { useMembership } from "@/hooks/useMembership";

export function CreatorCapabilityGuard({ capability, requiredPlan, title, description, children }: {
  capability: CreatorCapability;
  requiredPlan: PublicCreatorPlanCode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const membership = useMembership();
  if (membership.isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (!hasCreatorCapability(membership.data?.plan_code, capability)) return <div className="mx-auto max-w-2xl"><LockedFeatureCard title={title} description={description} requiredPlan={requiredPlan} /></div>;
  return <>{children}</>;
}
