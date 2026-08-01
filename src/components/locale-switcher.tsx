"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1 text-[10px]"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          aria-label={`Switch language to ${l}`}
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-md px-2 py-1.5 font-semibold uppercase tracking-wider transition-colors",
            l === locale
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
