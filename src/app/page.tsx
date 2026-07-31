"use client";

import { Tokenizer } from "@/components/tokenizer";
import { EmbeddingVisualizer } from "@/components/embedding-visualizer";
import { CookieConsent } from "@/components/cookie-consent";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale, ui } from "@/lib/i18n";
import { MODELS } from "@/lib/models";

const EXACT_LABELS = MODELS.filter((m) => m.accuracy === "exact")
  .map((m) => m.label.split(" (")[0].split(" /")[0])
  .filter((label, i, arr) => arr.indexOf(label) === i);

export default function Home() {
  const { locale, setLocale } = useLocale();
  const t = ui[locale];

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:px-8 lg:px-12">
      <header className="mb-8 flex w-full max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight">{t.heroTitle}</h1>
          <p className="text-muted-foreground max-w-2xl">{t.heroSubtitle}</p>
        </div>
        <LocaleSwitcher locale={locale} setLocale={setLocale} />
      </header>
      <Tokenizer locale={locale} />
      <div className="mt-6 w-full">
        <EmbeddingVisualizer locale={locale} />
      </div>
      <footer className="text-muted-foreground mt-12 flex w-full max-w-[1600px] flex-col items-center gap-1 border-t px-4 py-6 text-sm">
        <p className="max-w-[1600px] text-center text-xs">
          {t.footerNote(EXACT_LABELS.join(", "))}
        </p>
        <a href="https://vibe-portfolio-one.vercel.app/">{t.createdBy}</a>
        <span>{t.poweredBy}</span>
      </footer>
      <CookieConsent locale={locale} />
    </div>
  );
}
