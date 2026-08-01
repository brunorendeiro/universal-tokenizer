"use client";

// Alternating palette tuned to stay readable in both light and dark theme —
// each pair is [background, text].
const PALETTE = [
  "border-rose-200 bg-rose-50 text-rose-900",
  "border-amber-200 bg-amber-50 text-amber-900",
  "border-lime-200 bg-lime-50 text-lime-900",
  "border-teal-200 bg-teal-50 text-teal-900",
  "border-sky-200 bg-sky-50 text-sky-900",
  "border-violet-200 bg-violet-50 text-violet-900",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  "border-orange-200 bg-orange-50 text-orange-900",
];

export function TokenVisualizer({
  segments,
  overflow,
  emptyText,
  overflowText,
}: {
  segments: string[];
  /** true when the text was too long to break down and only a count is available */
  overflow: boolean;
  emptyText: string;
  overflowText: string;
}) {
  if (overflow) {
    return <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">{overflowText}</p>;
  }

  if (segments.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="flex max-h-80 flex-wrap gap-1 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-6">
      {segments.map((segment, i) => (
        <span
          key={i}
          title={`Token #${i + 1}`}
          className={`whitespace-pre-wrap rounded border px-1 ${PALETTE[i % PALETTE.length]}`}
        >
          {segment}
        </span>
      ))}
    </div>
  );
}
