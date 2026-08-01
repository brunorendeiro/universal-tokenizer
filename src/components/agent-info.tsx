import { Bot, Braces, Coins, History, Layers3, Wrench } from "lucide-react";
import { ui, type Locale } from "@/lib/i18n";

const ICONS = [Coins, History, Wrench, Braces, Layers3];

export function AgentInfo({ locale }: { locale: Locale }) {
  const t = ui[locale].agentInfo;

  return (
    <section className="surface-panel overflow-hidden">
      <header className="border-b border-slate-200 px-7 py-6">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
          <Bot className="size-3.5" />
          {t.eyebrow}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{t.title}</h2>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-600">{t.intro}</p>
      </header>

      <div className="grid grid-cols-5 gap-px bg-slate-200">
        {t.points.map((point, index) => {
          const Icon = ICONS[index] ?? Layers3;
          return (
            <article key={point} className="min-h-64 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                  <Icon className="size-4" />
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-8 text-sm leading-6 text-slate-700">{point}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
