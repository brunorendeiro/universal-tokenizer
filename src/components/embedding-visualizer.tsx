"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ui, type Locale } from "@/lib/i18n";
import { useEmbeddingWorker } from "@/lib/use-embedding-worker";
import { pcaTo3D } from "@/lib/pca";
import { TokenCloud3D } from "@/components/token-cloud-3d";
import { AlertCircle, BrainCircuit, RefreshCw, Sparkles } from "lucide-react";
import { createRequestId } from "@/lib/request-id";

const CLOUD_SAMPLE = "The quick brown fox jumps over the lazy dog.";
const COMPARE_SAMPLE_A = "I love hiking in the mountains.";
const COMPARE_SAMPLE_B = "Trekking through peaks brings me joy.";
const DEBOUNCE_MS = 400;

type Phase = "idle" | "loading" | "ready" | "error";

interface TokenRow {
  token: string;
  values: number[];
}

export function EmbeddingVisualizer({ locale }: { locale: Locale }) {
  const strings = ui[locale];
  const t = strings.embeddings;
  const request = useEmbeddingWorker();

  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progressPct, setProgressPct] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [cloudText, setCloudText] = useState(CLOUD_SAMPLE);
  const [rows, setRows] = useState<TokenRow[]>([]);

  const [textA, setTextA] = useState(COMPARE_SAMPLE_A);
  const [textB, setTextB] = useState(COMPARE_SAMPLE_B);
  const [similarity, setSimilarity] = useState<number | null>(null);

  const generationRef = useRef(0);

  function activate() {
    setActive(true);
    setPhase("loading");
    setErrorMessage(null);
    setProgressPct(0);
    const requestId = createRequestId();
    request({ type: "tokenEmbeddings", requestId, text: cloudText }, (loaded, total) => {
      setProgressPct(total > 0 ? Math.round((loaded / total) * 100) : 0);
    }).then((res) => {
      if (res.type === "tokenEmbeddings" && !res.error) {
        setRows(res.tokens.map((token, i) => ({ token, values: res.vectors[i] ?? [] })));
        setPhase("ready");
      } else {
        setErrorMessage(res.error ?? "Embedding model could not be loaded");
        setPhase("error");
      }
    });
  }

  // Re-run the point cloud whenever its text changes, once activated.
  useEffect(() => {
    if (!active || phase !== "ready") return;
    const generation = ++generationRef.current;
    const handle = setTimeout(() => {
      const requestId = createRequestId();
      request({ type: "tokenEmbeddings", requestId, text: cloudText }).then((res) => {
          if (generationRef.current !== generation) return;
          if (res.type === "tokenEmbeddings" && !res.error) {
            setRows(res.tokens.map((token, i) => ({ token, values: res.vectors[i] ?? [] })));
          } else if (res.error) {
            setErrorMessage(res.error);
          }
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudText, active, phase]);

  // Re-run the comparator whenever either text changes, once activated.
  useEffect(() => {
    if (!active || phase !== "ready") return;
    const handle = setTimeout(() => {
      const requestId = createRequestId();
      request({ type: "similarity", requestId, textA, textB }).then((res) => {
          if (res.type === "similarity" && !res.error) {
            setSimilarity(res.similarity);
          } else if (res.error) {
            setErrorMessage(res.error);
          }
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textA, textB, active, phase]);

  const cloudPoints = useMemo(() => pcaTo3D(rows.map((r) => r.values)).points, [rows]);

  const magnitudes = useMemo(() => {
    const norms = rows.map((r) => Math.sqrt(r.values.reduce((s, v) => s + v * v, 0)));
    const maxNorm = Math.max(1e-6, ...norms);
    return norms.map((n) => n / maxNorm);
  }, [rows]);

  const similarityLabel = (s: number) => {
    if (s >= 0.75) return t.similarityVeryHigh;
    if (s >= 0.5) return t.similarityHigh;
    if (s >= 0.25) return t.similarityMedium;
    return t.similarityLow;
  };

  return (
    <Card className="surface-panel mx-auto w-full border-0 bg-transparent py-0 ring-0">
      <CardHeader className="border-b border-slate-200 px-6 py-5">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
          <BrainCircuit className="size-3.5" />
          384D / PCA / Cosine similarity
        </div>
        <CardTitle className="text-xl font-semibold text-slate-950">{t.title}</CardTitle>
        <CardDescription className="max-w-4xl leading-6 text-slate-600">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 p-6">
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          {t.disclaimer}
        </p>

        {!active && (
          <Button
            type="button"
            onClick={activate}
            className="h-11 self-start bg-slate-950 px-5 text-white hover:bg-slate-800"
          >
            <Sparkles className="size-4" />
            {t.activateButton}
          </Button>
        )}

        {phase === "loading" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-blue-900">{t.loading(String(progressPct))}</p>
              <span className="font-mono text-xs text-blue-700">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3 text-sm text-red-700">
              <AlertCircle className="size-4" />
              <span title={errorMessage ?? undefined}>{strings.tokenizerError}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={activate}>
              <RefreshCw className="size-3.5" />
              {strings.retry}
            </Button>
          </div>
        )}

        {errorMessage && phase === "ready" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="size-3.5" />
            {errorMessage}
          </div>
        )}

        {phase === "ready" && (
          <>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{t.cloudTitle}</h3>
              <p className="text-xs leading-5 text-slate-500">{t.cloudDesc}</p>
              <Textarea
                value={cloudText}
                onChange={(e) => setCloudText(e.target.value)}
                className="min-h-20 resize-y border-slate-200 bg-slate-50 font-mono text-sm"
              />
              <TokenCloud3D
                tokens={rows.map((r) => r.token)}
                points={cloudPoints}
                magnitudes={magnitudes}
              />
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-600">
                <span>{t.cloudDragHint}</span>
                <span>{t.cloudColorHint}</span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{t.compareTitle}</h3>
              <p className="text-xs leading-5 text-slate-500">{t.compareDesc}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Textarea
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                  placeholder={t.textAPlaceholder}
                  className="min-h-20 resize-y border-slate-200 bg-slate-50 text-sm"
                />
                <Textarea
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  placeholder={t.textBPlaceholder}
                  className="min-h-20 resize-y border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              {similarity !== null && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{t.similarityLabel}</span>
                    <span className="font-mono font-semibold tabular-nums text-blue-700">
                      {Math.round(similarity * 100)}% — {similarityLabel(similarity)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width]"
                      style={{ width: `${Math.round(similarity * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
