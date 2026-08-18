import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Headphones, Music2, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { eyebrow:string; title:string; description:string; children:ReactNode; footer:ReactNode; wide?:boolean };

export function CreatorAuthShell({ eyebrow,title,description,children,footer,wide=false }: Props) {
  return (
    <main className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#0b0911] p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 right-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <Link to="/" className="relative z-10 inline-flex items-center gap-3 text-xl font-black tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/15"><Music2 className="h-5 w-5 text-violet-300" /></span>VYBE
          </Link>
          <div className="relative z-10 max-w-md">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">VYBE Creator Studio</p>
            <h1 className="text-5xl font-black leading-[1.04] tracking-tight">Your work.<br/>Your audience.<br/><span className="text-violet-300">Your VYBE.</span></h1>
            <p className="mt-6 text-base leading-7 text-zinc-400">A professional home for independent creators to organize their presence, share what they create, and grow direct relationships with supporters.</p>
            <div className="mt-8 grid gap-3 text-sm text-zinc-300">
              <p className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-violet-300"/>Build and manage your creator presence</p>
              <p className="flex items-center gap-3"><Users className="h-4 w-4 text-violet-300"/>Grow community, not just followers</p>
              <p className="flex items-center gap-3"><Headphones className="h-4 w-4 text-violet-300"/>Still experience VYBE as a supporter</p>
            </div>
          </div>
          <p className="relative z-10 text-xs text-zinc-600">Creator-first. Community-powered.</p>
        </section>
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className={cn("w-full", wide ? "max-w-2xl" : "max-w-lg")}>
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3 text-xl font-black"><span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/15"><Music2 className="h-4 w-4 text-violet-300"/></span>VYBE</Link>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Creator Studio</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0e0e15] p-6 shadow-2xl shadow-black/40 sm:p-8">
              <p className="text-sm font-semibold text-violet-300">{eyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
              <div className="mt-7">{children}</div>
              <div className="mt-7 border-t border-white/10 pt-5 text-sm text-zinc-400">{footer}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
