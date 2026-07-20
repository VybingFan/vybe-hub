import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitConnection } from "@/hooks/useConnections";

export function ListenerConnectionForm({ slug, artistName }: { slug: string; artistName: string }) {
  const submit = useSubmitConnection(slug);
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
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send your request."); }
  };
  if (complete) return <section className="mt-8 rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-8 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-300" /><h2 className="mt-3 text-2xl font-semibold">Connection request sent</h2><p className="mt-2 text-white/60">{artistName} can now see the information you chose to share.</p></section>;
  return (
    <section className="mt-8 rounded-[2rem] border border-fuchsia-300/20 bg-white/[.045] p-7 md:p-9">
      <div className="max-w-2xl"><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[.2em] text-fuchsia-200"><Mail className="h-4 w-4" /> Stay connected</p><h2 className="mt-3 text-3xl font-semibold">Hear more from {artistName}</h2><p className="mt-3 text-white/60">Choose what you want to share. Your details go privately to this creator and are never inferred from anonymous listening.</p></div>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <Input name="displayName" maxLength={80} placeholder="Name or display name (optional)" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
        <Input name="email" type="email" required maxLength={255} placeholder="Email address" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
        <Input name="socialHandle" maxLength={120} placeholder="Social handle (optional)" className="border-white/15 bg-white/5 text-white placeholder:text-white/40 md:col-span-2" />
        <Textarea name="message" maxLength={500} placeholder="Optional message to the artist" className="border-white/15 bg-white/5 text-white placeholder:text-white/40 md:col-span-2" />
        <label className="flex items-start gap-3 text-sm text-white/70 md:col-span-2"><input name="consentShare" type="checkbox" required className="mt-1" /><span>I agree to share this information privately with {artistName} so they can respond to my request.</span></label>
        <label className="flex items-start gap-3 text-sm text-white/70 md:col-span-2"><input name="consentUpdates" type="checkbox" className="mt-1" /><span>I would also like future artist updates when messaging tools become available. I can change my mind later.</span></label>
        {error && <p className="text-sm text-red-300 md:col-span-2">{error}</p>}
        <Button disabled={submit.isPending} className="w-fit rounded-full bg-white text-black hover:bg-white/90 md:col-span-2">{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send connection request</Button>
      </form>
    </section>
  );
}
