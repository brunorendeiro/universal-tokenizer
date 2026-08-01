"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileText,
  Gauge,
  GitCompareArrows,
  Info,
  LockKeyhole,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODELS, PROVIDERS, type ModelDef } from "@/lib/models";
import { estimateCost } from "@/lib/pricing";
import { useTokenizerWorker } from "@/lib/use-tokenizer-worker";
import { TokenVisualizer } from "@/components/token-visualizer";
import { ui, type Locale } from "@/lib/i18n";

const DEFAULT_MODEL_ID = MODELS[0].id;
const COMPARE_MODEL_ID = MODELS[2]?.id ?? MODELS[0].id;
const SAMPLE_TEXT =
  "Paste your prompt here to see how many tokens each model uses — and what it would cost.";
const DEBOUNCE_MS = 220;

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
  error?: string;
}

function createRow(model: ModelDef): Row {
  return {
    model,
    tokens: 0,
    segments: [],
    overflow: false,
    status: "idle",
  };
}

function emptyRows(): Record<string, Row> {
  return Object.fromEntries(MODELS.map((model) => [model.id, createRow(model)]));
}

export function Tokenizer({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedId, setSelectedId] = useState(DEFAULT_MODEL_ID);
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState(COMPARE_MODEL_ID);
  const [outputTokens, setOutputTokens] = useState(500);
  const [rows, setRows] = useState<Record<string, Row>>(emptyRows);
  const [loadAllExact, setLoadAllExact] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [copied, setCopied] = useState(false);
  const request = useTokenizerWorker();
  const generationRef = useRef(0);

  const formatNumber = useMemo(() => {
    const formatter = new Intl.NumberFormat(INTL_LOCALE[locale]);
    return (number: number) => formatter.format(number);
  }, [locale]);

  const selectedModel = useMemo(
    () => MODELS.find((model) => model.id === selectedId)!,
    [selectedId],
  );
  const compareModel = useMemo(
    () => MODELS.find((model) => model.id === compareId)!,
    [compareId],
  );

  useEffect(() => {
    const generation = ++generationRef.current;
    const primaryIds = Array.from(
      new Set([selectedId, ...(compareMode ? [compareId] : [])]),
    );
    const quickIds = MODELS.filter((model) => model.engine.kind !== "hf").map(
      (model) => model.id,
    );
    const backgroundExactIds = loadAllExact
      ? MODELS.filter((model) => model.engine.kind === "hf").map(
          (model) => model.id,
        )
      : [];
    const targetIds = new Set([
      ...primaryIds,
      ...quickIds,
      ...backgroundExactIds,
    ]);

    const handle = window.setTimeout(() => {
      setRows((previous) =>
        Object.fromEntries(
          MODELS.map((model) => {
            const previousRow = previous[model.id] ?? createRow(model);
            if (!targetIds.has(model.id)) {
              return [model.id, createRow(model)];
            }
            return [
              model.id,
              { ...previousRow, status: "loading" as Status, error: undefined },
            ];
          }),
        ),
      );

      const applyResult = async (modelId: string) => {
        if (generationRef.current !== generation) return;
        const model = MODELS.find((candidate) => candidate.id === modelId)!;
        const result = await request(modelId, text);
        if (generationRef.current !== generation) return;
        setRows((previous) => ({
          ...previous,
          [modelId]: {
            model,
            tokens: result.tokens,
            segments: result.segments,
            overflow: result.segments.length === 0 && result.tokens > 0,
            status: result.error ? "error" : "ready",
            error: result.error,
          },
        }));
      };

      void (async () => {
        await Promise.all(primaryIds.map(applyResult));
        if (generationRef.current !== generation) return;

        const primarySet = new Set(primaryIds);
        await Promise.all(
          quickIds.filter((id) => !primarySet.has(id)).map(applyResult),
        );

        if (!loadAllExact || generationRef.current !== generation) return;
        for (const modelId of backgroundExactIds) {
          if (primarySet.has(modelId)) continue;
          await applyResult(modelId);
        }
      })();
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [
    compareId,
    compareMode,
    loadAllExact,
    request,
    retryNonce,
    selectedId,
    text,
  ]);

  const readyRows = Object.values(rows).filter((row) => row.status === "ready");
  const maxTokens = Math.max(1, ...readyRows.map((row) => row.tokens));
  const exactRows = MODELS.filter((model) => model.engine.kind === "hf").map(
    (model) => rows[model.id],
  );
  const loadingEveryExact =
    loadAllExact && exactRows.some((row) => row?.status === "loading");

  async function copyPrompt() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_390px] items-start gap-6">
      <section className="surface-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">{t.yourTextTitle}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{t.yourTextDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ToolButton
              icon={copied ? Check : Copy}
              label={copied ? t.copiedText : t.copyText}
              onClick={() => void copyPrompt()}
              disabled={!text}
            />
            <ToolButton
              icon={Trash2}
              label={t.clearText}
              onClick={() => setText("")}
              disabled={!text}
            />
          </div>
        </div>

        <div className="p-6">
          <div className="focus-glow overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t.textareaPlaceholder}
              spellCheck={false}
              className="min-h-56 w-full resize-y bg-transparent px-5 py-4 font-mono text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-600"
            />
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="technical-label">{t.charCount(formatNumber(text.length))}</span>
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <LockKeyhole className="size-3.5" />
                {t.localBadge}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <label className="block text-xs font-medium text-slate-800" htmlFor="output-budget">
                {t.responseBudgetLabel}
              </label>
              <p className="mt-1 text-[11px] text-slate-500">{t.responseBudgetHint}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="output-budget"
                type="number"
                min={0}
                max={200000}
                step={100}
                value={outputTokens}
                onChange={(event) =>
                  setOutputTokens(
                    Math.max(0, Math.min(200000, Number(event.target.value) || 0)),
                  )
                }
                className="h-9 w-28 rounded-lg border border-slate-300 bg-slate-50 px-3 text-right font-mono text-sm text-slate-950 outline-none focus:border-blue-400"
              />
              <span className="font-mono text-[11px] text-slate-500">TOK</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">{t.modelTitle}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {compareMode ? t.modelDescCompare : t.modelDescSingle}
              </p>
            </div>
            <button
              type="button"
              aria-pressed={compareMode}
              onClick={() => setCompareMode((value) => !value)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                compareMode
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <GitCompareArrows className="size-3.5" />
              {compareMode ? t.compareToggleOn : t.compareToggleOff}
            </button>
          </div>

          <div
            className={`grid gap-px border-t border-slate-200 bg-slate-200 ${
              compareMode ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <ModelPanel
              t={t}
              formatNumber={formatNumber}
              model={selectedModel}
              selectedId={selectedId}
              onSelect={setSelectedId}
              row={rows[selectedId]}
              text={text}
              outputTokens={outputTokens}
              onRetry={() => setRetryNonce((value) => value + 1)}
            />
            {compareMode && (
              <ModelPanel
                t={t}
                formatNumber={formatNumber}
                model={compareModel}
                selectedId={compareId}
                onSelect={setCompareId}
                row={rows[compareId]}
                text={text}
                outputTokens={outputTokens}
                onRetry={() => setRetryNonce((value) => value + 1)}
              />
            )}
          </div>
        </div>
      </section>

      <aside className="surface-panel sticky top-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-950">{t.efficiencyTitle}</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{t.efficiencyDesc}</p>
        </div>

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-3">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <MethodLegend label={t.badgeExact} text={t.exactMethod} exact />
            <MethodLegend label={t.badgeApprox} text={t.proxyMethod} />
          </div>

          <div className="space-y-1">
            {MODELS.map((model, index) => {
              const row = rows[model.id];
              const selected = model.id === selectedId;
              const width =
                row?.status === "ready"
                  ? Math.max(2, (row.tokens / maxTokens) * 100)
                  : 0;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedId(model.id)}
                  className={`group relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-all ${
                    selected
                      ? "border-blue-200 bg-blue-50"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="w-5 font-mono text-[10px] text-slate-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-slate-800">
                          {model.label}
                        </span>
                        <RowValue row={row} t={t} formatNumber={formatNumber} />
                      </div>
                      <div className="mt-2 h-px overflow-hidden bg-slate-100">
                        <div
                          className={`h-full transition-[width] duration-500 ${
                            model.accuracy === "exact" ? "bg-blue-500" : "bg-amber-400"
                          } ${row?.status === "loading" ? "loading-line w-1/3" : ""}`}
                          style={row?.status === "ready" ? { width: `${width}%` } : undefined}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!loadAllExact && (
            <button
              type="button"
              onClick={() => setLoadAllExact(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Download className="size-3.5" />
              {t.loadExactModels}
            </button>
          )}
          {loadingEveryExact && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
              <RefreshCw className="size-3.5 animate-spin text-blue-600" />
              {t.loadingExactModels}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function ModelPanel({
  t,
  formatNumber,
  model,
  selectedId,
  onSelect,
  row,
  text,
  outputTokens,
  onRetry,
}: {
  t: (typeof ui)[Locale];
  formatNumber: (number: number) => string;
  model: ModelDef;
  selectedId: string;
  onSelect: (id: string) => void;
  row: Row | undefined;
  text: string;
  outputTokens: number;
  onRetry: () => void;
}) {
  const inputCost =
    row?.status === "ready" ? estimateCost(row.tokens, model.pricing, "input") : null;
  const outputCost = estimateCost(outputTokens, model.pricing, "output");
  const totalCost =
    inputCost !== null && outputCost !== null ? inputCost + outputCost : null;
  const contextPercentage =
    model.contextWindow && row?.status === "ready"
      ? `${((row.tokens / model.contextWindow) * 100).toFixed(2)}%`
      : null;

  return (
    <div className="min-w-0 bg-white p-6">
      <Select value={selectedId} onValueChange={(value) => value && onSelect(value)}>
        <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50 px-3 text-slate-900 shadow-none">
          <SelectValue placeholder={t.choosePlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {PROVIDERS.map((provider) => (
            <SelectGroup key={provider}>
              <SelectLabel>{provider}</SelectLabel>
              {MODELS.filter((candidate) => candidate.provider === provider).map(
                (candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </SelectItem>
                ),
              )}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`rounded-md border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${
            model.accuracy === "exact"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {model.accuracy === "exact" ? t.badgeExact : t.badgeApprox}
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">
          {model.provider}
        </span>
        {model.contextWindow && (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-500">
            {t.contextBadge(formatNumber(model.contextWindow))}
          </span>
        )}
      </div>

      {row?.status === "error" ? (
        <div className="mt-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="size-4" />
            <span title={row.error}>{t.tokenizerError}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-[11px] font-medium text-red-700 hover:text-slate-950"
          >
            <RefreshCw className="size-3" />
            {t.retry}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <PrimaryStat
            label={t.statTokens}
            value={row?.status === "ready" ? formatNumber(row.tokens) : "—"}
            loading={row?.status === "loading"}
            accent
          />
          <PrimaryStat label={t.statChars} value={formatNumber(text.length)} />
          <PrimaryStat
            label={t.statContextPct}
            value={contextPercentage ?? "—"}
            hint={t.statContextPctHint}
          />
        </div>
      )}

      {contextPercentage && model.contextWindow && row?.status === "ready" && (
        <div className="mt-3 flex gap-3 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-3 text-slate-600">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
          <div className="text-[11px] leading-5">
            <p className="font-semibold text-slate-800">
              {t.contextExplainerTitle(contextPercentage)}
            </p>
            <p className="mt-0.5">
              {t.contextExplainerBody(
                formatNumber(row.tokens),
                formatNumber(model.contextWindow),
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
        <CostStat label={t.statInputCost} value={formatCost(inputCost)} />
        <CostStat label={t.statOutputCost} value={formatCost(outputCost)} />
        <CostStat label={t.statTotalCost} value={formatCost(totalCost)} total />
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">
        <span className="font-medium text-slate-700">
          {model.accuracy === "exact" ? t.badgeExact : t.badgeApprox}:
        </span>{" "}
        {model.accuracy === "exact" ? t.exactMethod : t.proxyMethod}
      </div>

      {model.noteKey && (
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          {t.notes[model.noteKey]}
        </p>
      )}

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="technical-label">{t.visualizerHint}</p>
          {row?.status === "ready" && (
            <span className="font-mono text-[10px] text-slate-500">
              {formatNumber(row.tokens)} TOK
            </span>
          )}
        </div>
        <TokenVisualizer
          segments={row?.segments ?? []}
          overflow={row?.overflow ?? false}
          emptyText={row?.status === "loading" ? "Analyzing…" : t.visualizerEmpty}
          overflowText={t.visualizerOverflow}
        />
      </div>

      <p className="mt-4 text-[10px] leading-4 text-slate-500">{t.plainTextNotice}</p>
    </div>
  );
}

function PrimaryStat({
  label,
  value,
  loading = false,
  accent = false,
  hint,
}: {
  label: string;
  value: string;
  loading?: boolean;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="surface-card p-3" title={hint}>
      <span className="technical-label block truncate">{label}</span>
      <span
        className={`mt-2 block font-mono text-2xl font-medium tracking-tight ${
          accent ? "text-blue-700" : "text-slate-950"
        } ${loading ? "animate-pulse" : ""}`}
      >
        {loading ? "···" : value}
      </span>
    </div>
  );
}

function CostStat({
  label,
  value,
  total = false,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <div className={`bg-white p-3 ${total ? "bg-blue-50" : ""}`}>
      <span className="technical-label block">{label}</span>
      <span className={`mt-1.5 block font-mono text-sm ${total ? "text-blue-700" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

function MethodLegend({
  label,
  text,
  exact = false,
}: {
  label: string;
  text: string;
  exact?: boolean;
}) {
  return (
    <div
      title={text}
      className={`rounded-lg border px-2.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider ${
        exact
          ? "border-blue-200 bg-blue-50 text-blue-600"
          : "border-amber-200 bg-amber-50 text-amber-600"
      }`}
    >
      {label}
    </div>
  );
}

function RowValue({
  row,
  t,
  formatNumber,
}: {
  row: Row | undefined;
  t: (typeof ui)[Locale];
  formatNumber: (number: number) => string;
}) {
  if (!row || row.status === "idle") {
    return <span className="shrink-0 font-mono text-[9px] text-slate-500">{t.tokenizerIdle}</span>;
  }
  if (row.status === "loading") {
    return <span className="shrink-0 font-mono text-[10px] text-slate-500">···</span>;
  }
  if (row.status === "error") {
    return <AlertCircle className="size-3 shrink-0 text-red-600" />;
  }
  return (
    <span className="shrink-0 font-mono text-[10px] text-slate-600">
      {formatNumber(row.tokens)}
    </span>
  );
}

function formatCost(cost: number | null): string {
  if (cost === null) return "—";
  if (cost === 0) return "$0.00";
  const decimals = cost < 0.01 ? 7 : 2;
  return `$${cost.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "")}`;
}
