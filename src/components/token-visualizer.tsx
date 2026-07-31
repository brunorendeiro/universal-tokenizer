"use client";

// Alternating palette tuned to stay readable in both light and dark theme —
// each pair is [background, text].
const PALETTE = [
  "bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-100",
  "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100",
  "bg-lime-200 text-lime-950 dark:bg-lime-900 dark:text-lime-100",
  "bg-teal-200 text-teal-950 dark:bg-teal-900 dark:text-teal-100",
  "bg-sky-200 text-sky-950 dark:bg-sky-900 dark:text-sky-100",
  "bg-violet-200 text-violet-950 dark:bg-violet-900 dark:text-violet-100",
  "bg-fuchsia-200 text-fuchsia-950 dark:bg-fuchsia-900 dark:text-fuchsia-100",
  "bg-orange-200 text-orange-950 dark:bg-orange-900 dark:text-orange-100",
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
    return <p className="text-muted-foreground text-sm">{overflowText}</p>;
  }

  if (segments.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-y-1 whitespace-pre-wrap rounded-md border p-3 font-mono text-sm leading-relaxed">
      {segments.map((segment, i) => (
        <span
          key={i}
          title={`Token #${i + 1}`}
          className={`whitespace-pre-wrap rounded-sm px-0.5 ${PALETTE[i % PALETTE.length]}`}
        >
          {segment}
        </span>
      ))}
    </div>
  );
}
