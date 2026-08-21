import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitConnection } from "@/hooks/useConnections";

export function ListenerConnectionForm({ slug, artistName }: { slug: string; artistName: string }) {
  const submit = useSubmitConnection(slug);
  const [expanded, setExpanded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");

    try {
      await submit.mutateAsync({
        displayName: String(data.get("displayName") || ""),
        email: String(data.get("email") || ""),
        socialHandle: String(data.get("socialHandle") || ""),
        message: String(data.get("message") || ""),
        consentShare: data.get("consentShare") === "on",
        consentUpdates: data.get("consentUpdates") === "on",
      });
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send your request.");
    }
  };

  if (complete) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" />
        <div>
          <h2 className="font-semibold">Connection request sent</h2>
          <p className="text-sm text-white/55">{artistName} can now see the information you chose to share.</p>
        </div>
      </section>
    );
  }

  if (!expanded) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-fuchsia-300/20 bg-white/[.035] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-fuchsia-300" />Connect privately with {artistName}</p>
          <p className="mt-1 text-sm text-white/55">Share only the contact details and message you choose.</p>
        </div>
        <Button type="button" size="sm" onClick={() => setExpanded(true)} className="shrink-0 rounded-full bg-white text-black hover:bg-white/90">Send a request</Button>
      </section>
    );
  }

  return (
    <section className="relative rounded-[1.5rem] border border-fuchsia-300/20 bg-white/[.045] p-4 sm:p-6">
      <button type="button" onClick={() => setExpanded(false)} className="absolute right-3 top-3 rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close connection form"><X className="h-4 w-4" /></button>
      <div className="pr-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-fuchsia-200"><Mail className="h-4 w-4" />Stay connected</p>
        <h2 className="mt-2 text-xl font-semibold">Connect with {artistName}</h2>
        <p className="mt-1 text-sm text-white/55">Your details go privately to this creator and are never inferred from anonymous listening.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <Input name="displayName" maxLength={80} placeholder="Name or display name (optional)" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
        <Input name="email" type="email" required maxLength={255} placeholder="Email address" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
        <Input name="socialHandle" maxLength={120} placeholder="Social handle (optional)" className="border-white/15 bg-white/5 text-white placeholder:text-white/40 md:col-span-2" />
        <Textarea name="message" maxLength={500} placeholder="Optional message to the creator" className="min-h-20 border-white/15 bg-white/5 text-white placeholder:text-white/40 md:col-span-2" />
        <label className="flex items-start gap-3 text-sm text-white/70 md:col-span-2"><input name="consentShare" type="checkbox" required className="mt-1" /><span>I agree to share this information privately with {artistName} so they can respond.</span></label>
        <label className="flex items-start gap-3 text-sm text-white/70 md:col-span-2"><input name="consentUpdates" type="checkbox" className="mt-1" /><span>I would also like future creator updates when messaging tools become available.</span></label>
        {error ? <p className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
        <Button disabled={submit.isPending} className="w-fit rounded-full bg-white text-black hover:bg-white/90 md:col-span-2">{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send connection request</Button>
      </form>
    </section>
  );
}
