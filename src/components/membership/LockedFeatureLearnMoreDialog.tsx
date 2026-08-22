import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LockedFeatureLearnMoreDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  howItWorks: string[];
  benefits: string[];
  requiredPlanLabel: string;
  compact?: boolean;
}

export function LockedFeatureLearnMoreDialog({
  triggerLabel,
  title,
  description,
  howItWorks,
  benefits,
  requiredPlanLabel,
  compact = false,
}: LockedFeatureLearnMoreDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant={compact ? "outline" : "ghost"} size={compact ? "sm" : "default"}>
          <Sparkles className="mr-2 h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-base leading-7">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section>
            <h3 className="font-semibold">How it works</h3>
            <div className="mt-3 space-y-3">
              {howItWorks.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold">How it helps your growth</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 text-sm leading-6">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p>{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Plan availability</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This tool is included with {requiredPlanLabel}. Your current included tools remain available whether or not you change plans.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button asChild variant="outline">
            <Link to="/creator-memberships">Compare creator plans</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
