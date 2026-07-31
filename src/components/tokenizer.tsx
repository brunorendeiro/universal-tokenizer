"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MODELS, PROVIDERS, type ModelDef } from "@/lib/models";
import { estimateCost } from "@/lib/pricing";
import { useTokenizerWorker } from "@/lib/use-tokenizer-worker";
import { TokenVisualizer } from "@/components/token-visualizer";
import { ui, type Locale } from "@/lib/i18n";

const DEFAULT_MODEL_ID = MODELS[0].id;
const COMPARE_MODEL_ID = MODELS[2]?.id ?? MODELS[0].id;
const SAMPLE_TEXT =
  "Paste your prompt here to see how many tokens each model uses — and what it would cost.";
const DEBOUNCE_MS = 250;

const INTL_LOCALE: Record<Locale, string> = {
  pt: "pt-PT",
  en: "en-US",
  de: "de-DE",
};

type Status = "idle" | "loading" | "ready" | "error";

interface Row {
  model: ModelDef;
  tokens: number;
  segments: string[];
  overflow: boolean;
  status: Status;
}

function emptyRows(): Record<string, Row> {
  return Object.fromEntries(
    MODELS.map((m) => [
      m.id,
      { model: m, tokens: 0, segments: [], overflow: false, status: "idle" as Status },
    ]),
  );
}

export function Tokenizer({ locale }: { locale: Locale }) {
  const t = ui[locale];

  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedId, setSelectedId] = useState(DEFAULT_MODEL_ID);
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState(COMPARE_MODEL_ID);
  const [rows, setRows] = useState<Record<string, Row>>(emptyRows);

  const request = useTokenizerWorker();
  // Guards against a slow response from an earlier keystroke overwriting a
  // newer one — only the latest debounce "generation" is allowed to apply.
  const generationRef = useRef(0);

  const formatNumber = useMemo(() => {
    const fmt = new Intl.NumberFormat(INTL_LOCALE[locale]);
    return (n: number) => fmt.format(n);
  }, [locale]);

  const formatCost = (n: number) => {
    if (n === 0) return "$0.00";
    // Small prompts can cost a fraction of a cent — show up to 7 decimal
    // places for those, trimming trailing zeros, instead of hiding the
    // value behind "< $0.01".
    const decimals = n < 0.01 ? 7 : 2;
    const trimmed = n
      .toFixed(decimals)
      .replace(/0+$/, "")
      .replace(/\.$/, "");
    return `$${trimmed}`;
  };

  const selectedModel = useMemo(
    () => MODELS.find((m) => m.id === selectedId)!,
    [selectedId],
  );
  const compareModel = useMemo(
    () => MODELS.find((m) => m.id === compareId)!,
    [compareId],
  );

  useEffect(() => {
    const generation = ++generationRef.current;
    const handle = setTimeout(() => {
      for (const model of MODELS) {
        setRows((prev) => ({
          ...prev,
          [model.id]: { ...prev[model.id], status: "loading" },
        }));

        request(model.id, text).then((res) => {
          if (generationRef.current !== generation) return; // stale
          setRows((prev) => ({
            ...prev,
            [model.id]: {
              model,
              tokens: res.tokens,
              segments: res.segments,
              overflow: res.segments.length === 0 && res.tokens > 0,
              status: res.error ? "error" : "ready",
            },
          }));
        });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [text, request]);

  const maxTokens = Math.max(1, ...Object.values(rows).map((r) => r.tokens));

  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.yourTextTitle}</CardTitle>
            <CardDescription>{t.yourTextDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.textareaPlaceholder}
              className="min-h-32 resize-y font-mono text-sm"
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {t.charCount(formatNumber(text.length))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{t.modelTitle}</CardTitle>
              <CardDescription>
                {compareMode ? t.modelDescCompare : t.modelDescSingle}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCompareMode((v) => !v)}
            >
              {compareMode ? t.compareToggleOn : t.compareToggleOff}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div
              className={`grid gap-6 ${compareMode ? "xl:grid-cols-2" : "grid-cols-1"}`}
            >
              <ModelPanel
                t={t}
                formatNumber={formatNumber}
                formatCost={formatCost}
                model={selectedModel}
                selectedId={selectedId}
                onSelect={setSelectedId}
                row={rows[selectedId]}
                text={text}
              />
              {compareMode && (
                <ModelPanel
                  t={t}
                  formatNumber={formatNumber}
                  formatCost={formatCost}
                  model={compareModel}
                  selectedId={compareId}
                  onSelect={setCompareId}
                  row={rows[compareId]}
                  text={text}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-6">
        <CardHeader>
          <CardTitle>{t.efficiencyTitle}</CardTitle>
          <CardDescription>{t.efficiencyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          {MODELS.map((model) => {
            const row = rows[model.id];
            const widthPct =
              row?.status === "ready"
                ? Math.max(2, (row.tokens / maxTokens) * 100)
                : 0;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedId(model.id)}
                className={`group flex w-full flex-col gap-1 rounded-md border p-2 text-left transition-colors ${
                  model.id === selectedId
                    ? "border-foreground/40 bg-muted/50"
                    : "border-transparent hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{model.label}</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {row?.status === "ready" ? formatNumber(row.tokens) : "…"}
                    {" tok"}
                    {model.accuracy === "approx" && (
                      <span className="ml-1 opacity-60">≈</span>
                    )}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-foreground/70 h-full rounded-full transition-[width]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function ModelPanel({
  t,
  formatNumber,
  formatCost,
  model,
  selectedId,
  onSelect,
  row,
  text,
}: {
  t: (typeof ui)[Locale];
  formatNumber: (n: number) => string;
  formatCost: (n: number) => string;
  model: ModelDef;
  selectedId: string;
  onSelect: (id: string) => void;
  row: Row | undefined;
  text: string;
}) {
  const cost =
    row?.status === "ready" && model.pricing
      ? estimateCost(row.tokens, model.pricing)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <Select value={selectedId} onValueChange={(v) => v && onSelect(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t.choosePlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {PROVIDERS.map((provider) => (
            <SelectGroup key={provider}>
              <SelectLabel>{provider}</SelectLabel>
              {MODELS.filter((m) => m.provider === provider).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={model.accuracy === "exact" ? "default" : "secondary"}>
          {model.accuracy === "exact" ? t.badgeExact : t.badgeApprox}
        </Badge>
        {model.contextWindow && (
          <Badge variant="outline">
            {t.contextBadge(formatNumber(model.contextWindow))}
          </Badge>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label={t.statTokens}
          value={row?.status === "ready" ? formatNumber(row.tokens) : "…"}
        />
        <Stat label={t.statChars} value={formatNumber(text.length)} />
        <Stat
          label={t.statCost}
          value={cost !== null ? formatCost(cost) : "—"}
        />
        {model.contextWindow && row?.status === "ready" && (
          <Stat
            label={t.statContextPct}
            hint={t.statContextPctHint}
            value={`${((row.tokens / model.contextWindow) * 100).toFixed(2)}%`}
          />
        )}
      </div>

      {model.noteKey && (
        <p className="text-muted-foreground text-xs">{t.notes[model.noteKey]}</p>
      )}

      <div>
        <p className="mb-2 text-xs font-medium">{t.visualizerHint}</p>
        <TokenVisualizer
          segments={row?.segments ?? []}
          overflow={row?.overflow ?? false}
          emptyText={t.visualizerEmpty}
          overflowText={t.visualizerOverflow}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`text-muted-foreground text-xs ${hint ? "cursor-help underline decoration-dotted underline-offset-2" : ""}`}
        title={hint}
      >
        {label}
      </span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
