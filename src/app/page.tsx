"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Bot,
  BrainCircuit,
  Cpu,
  Database,
  LoaderCircle,
  ScanText,
  ShieldCheck,
} from "lucide-react";
import { Tokenizer } from "@/components/tokenizer";
import { AgentInfo } from "@/components/agent-info";
import { CookieConsent } from "@/components/cookie-consent";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale, ui } from "@/lib/i18n";
import { MODELS } from "@/lib/models";

const EmbeddingVisualizer = dynamic(
  () =>
    import("@/components/embedding-visualizer").then(
      (module) => module.EmbeddingVisualizer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="surface-panel flex min-h-72 items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-blue-600" />
      </div>
    ),
  },
);

type View = "workbench" | "embeddings" | "agents";

const EXACT_COUNT = MODELS.filter((model) => model.accuracy === "exact").length;

export default function Home() {
  const { locale, setLocale } = useLocale();
  const [view, setView] = useState<View>("workbench");
  const t = ui[locale];

  const navigation = [
    { id: "workbench" as const, label: t.navWorkbench, icon: ScanText },
    { id: "embeddings" as const, label: t.navEmbeddings, icon: BrainCircuit },
    { id: "agents" as const, label: t.navAgents, icon: Bot },
  ];

  return (
    <div className="min-h-screen min-w-[1024px] bg-[#f7f8fa]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1560px] px-10 pb-8 pt-7">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView("workbench")}
              className="group flex items-center gap-3 text-left"
              aria-label={t.navWorkbench}
            >
              <span className="grid size-10 place-items-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                <ScanText className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-tight text-slate-950">
                  Universal Tokenizer
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t.brandSubtitle}
                </span>
              </span>
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t.engineOnline}
              </div>
              <LocaleSwitcher locale={locale} setLocale={setLocale} />
            </div>
          </div>

          <div className="mt-14 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-12">
            <div>
              <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                <span className="h-px w-6 bg-blue-600" />
                {t.eyebrow}
              </div>
              <h1 className="max-w-4xl text-[clamp(3rem,4.5vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-slate-950">
                {t.heroTitle}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                {t.heroSubtitle}
              </p>
            </div>

            <div className="grid min-w-72 gap-2.5">
              <TrustMetric icon={ShieldCheck} label={t.localBadge} />
              <TrustMetric icon={Database} label={t.modelProfiles(MODELS.length)} />
              <TrustMetric icon={Cpu} label={t.exactTokenizers(EXACT_COUNT)} />
            </div>
          </div>

          <nav
            className="mt-12 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1.5"
            aria-label={t.sectionsLabel}
            role="tablist"
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(item.id)}
                  className={`flex min-w-52 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                    active
                      ? "border border-slate-200 bg-white text-slate-950 shadow-sm"
                      : "border border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1560px] px-10 py-9">
        {view === "workbench" && <Tokenizer locale={locale} />}
        {view === "embeddings" && <EmbeddingVisualizer locale={locale} />}
        {view === "agents" && <AgentInfo locale={locale} />}
      </main>

      <footer className="mx-auto flex w-full max-w-[1560px] items-center justify-between border-t border-slate-200 px-10 py-7 text-xs text-slate-500">
        <span>{t.footerNote("OpenAI, Meta, Mistral, Qwen and open-weight models")}</span>
        <div className="flex items-center gap-4">
          <a
            className="transition-colors hover:text-slate-950"
            href="https://vibe-portfolio-one.vercel.app/"
          >
            {t.createdBy}
          </a>
          <span className="text-slate-300">/</span>
          <span>{t.poweredBy}</span>
        </div>
      </footer>
      <CookieConsent locale={locale} />
    </div>
  );
}

function TrustMetric({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
      <Icon className="size-3.5 text-blue-600" />
      {label}
    </div>
  );
}
