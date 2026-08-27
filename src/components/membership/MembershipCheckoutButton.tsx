import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BillingInterval, PaidCreatorPlanCode } from "@/integrations/stripe/server";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useMembership } from "@/hooks/useMembership";

export function MembershipCheckoutButton({
  planCode,
  planName,
  interval,
}: {
  planCode: "creator_free" | PaidCreatorPlanCode;
  planName: string;
  interval: BillingInterval;
}) {
  const { user, primaryRole, isLoading } = useUser();
  const { data: membership } = useMembership(primaryRole === "creator" || primaryRole === "admin");
  const [isPending, setIsPending] = useState(false);

  if (planCode === "creator_free") {
    return (
      <Button asChild className="mt-7 bg-gradient-brand text-white">
        {user ? (
          <Link to="/dashboard">
            Open Creator Studio <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/creator/sign-up"
            search={{ plan: "creator_free", interval }}
          >
            Start free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        )}
      </Button>
    );
  }

  if (!isLoading && !user) {
    return (
      <Button asChild className="mt-7 bg-gradient-brand text-white">
        <Link
          to="/creator/sign-up"
          search={{ plan: planCode, interval }}
        >
          Join to choose {planName} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (primaryRole && !["creator", "admin"].includes(primaryRole)) {
    return (
      <Button disabled variant="outline" className="mt-7">
        Creator account required
      </Button>
    );
  }

  if (membership?.plan_code === "founding_beta") {
    return (
      <Button disabled variant="outline" className="mt-7">
        Founding Creator access active
      </Button>
    );
  }

  if (
    membership?.plan_code === planCode &&
    ["active", "trialing", "past_due"].includes(membership.billing.subscription_status || "")
  ) {
    return (
      <Button asChild variant="outline" className="mt-7">
        <Link to="/settings">Current membership</Link>
      </Button>
    );
  }

  const startCheckout = async () => {
    setIsPending(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in as a creator to choose a membership.");
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planCode, interval }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Checkout could not be started.");
      }
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout could not be started.");
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      className="mt-7 bg-gradient-brand text-white"
      disabled={isPending || isLoading}
      onClick={startCheckout}
    >
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Choose {planName}
    </Button>
  );
}