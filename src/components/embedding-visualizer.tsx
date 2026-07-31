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
import { buildHeatmapGradient } from "@/lib/heatmap-color";

const HEATMAP_SAMPLE = "The quick brown fox jumps over the lazy dog.";
const COMPARE_SAMPLE_A = "I love hiking in the mountains.";
const COMPARE_SAMPLE_B = "Trekking through peaks brings me joy.";
const DEBOUNCE_MS = 400;

type Phase = "idle" | "loading" | "ready";

interface TokenRow {
  token: string;
  values: number[];
}

export function EmbeddingVisualizer({ locale }: { locale: Locale }) {
  const t = ui[locale].embeddings;
  const request = useEmbeddingWorker();

  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progressPct, setProgressPct] = useState(0);

  const [heatmapText, setHeatmapText] = useState(HEATMAP_SAMPLE);
  const [rows, setRows] = useState<TokenRow[]>([]);

  const [textA, setTextA] = useState(COMPARE_SAMPLE_A);
  const [textB, setTextB] = useState(COMPARE_SAMPLE_B);
  const [similarity, setSimilarity] = useState<number | null>(null);

  const generationRef = useRef(0);

  function activate() {
    if (active) return;
    setActive(true);
    setPhase("loading");
    const requestId = crypto.randomUUID();
    request({ type: "tokenEmbeddings", requestId, text: heatmapText }, (loaded, total) => {
      setProgressPct(total > 0 ? Math.round((loaded / total) * 100) : 0);
    }).then((res) => {
      setPhase("ready");
      if (res.type === "tokenEmbeddings" && !res.error) {
        setRows(res.tokens.map((token, i) => ({ token, values: res.vectors[i] ?? [] })));
      }
    });
  }

  // Re-run the heatmap whenever its text changes, once activated.
  useEffect(() => {
    if (!active || phase !== "ready") return;
    const generation = ++generationRef.current;
    const handle = setTimeout(() => {
      const requestId = crypto.randomUUID();
      request({ type: "tokenEmbeddings", requestId, text: heatmapText }).then((res) => {
        if (generationRef.current !== generation) return;
        if (res.type === "tokenEmbeddings" && !res.error) {
          setRows(res.tokens.map((token, i) => ({ token, values: res.vectors[i] ?? [] })));
        }
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmapText, active, phase]);

  // Re-run the comparator whenever either text changes, once activated.
  useEffect(() => {
    if (!active || phase !== "ready") return;
    const handle = setTimeout(() => {
      const requestId = crypto.randomUUID();
      request({ type: "similarity", requestId, textA, textB }).then((res) => {
        if (res.type === "similarity" && !res.error) {
          setSimilarity(res.similarity);
        }
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textA, textB, active, phase]);

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const row of rows) {
      for (const v of row.values) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (!Number.isFinite(lo)) return { min: -1, max: 1 };
    // Center the diverging scale on zero (not on the data's raw min/max
    // midpoint) so "white" always means zero, not just "middling value" —
    // otherwise an asymmetric value range skews the whole heatmap toward
    // one color.
    const maxAbs = Math.max(Math.abs(lo), Math.abs(hi));
    return { min: -maxAbs, max: maxAbs };
  }, [rows]);

  const similarityLabel = (s: number) => {
    if (s >= 0.75) return t.similarityVeryHigh;
    if (s >= 0.5) return t.similarityHigh;
    if (s >= 0.25) return t.similarityMedium;
    return t.similarityLow;
  };

  return (
    <Card className="mx-auto w-full max-w-[1600px]">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
          {t.disclaimer}
        </p>

        {!active && (
          <Button type="button" onClick={activate} className="self-start">
            {t.activateButton}
          </Button>
        )}

        {phase === "loading" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm">{t.loading(String(progressPct))}</p>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-foreground/70 h-full rounded-full transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {phase === "ready" && (
          <>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t.heatmapTitle}</h3>
              <p className="text-muted-foreground text-xs">{t.heatmapDesc}</p>
              <Textarea
                value={heatmapText}
                onChange={(e) => setHeatmapText(e.target.value)}
                className="min-h-16 resize-y font-mono text-sm"
              />
              <div className="flex flex-col gap-1 overflow-x-auto rounded-md border p-3">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-24 shrink-0 truncate font-mono text-xs">
                      {row.token}
                    </span>
                    <div
                      className="h-4 flex-1 rounded-sm"
                      style={{ backgroundImage: buildHeatmapGradient(row.values, min, max) }}
                    />
                  </div>
                ))}
              </div>
              <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                <span>← {t.heatmapLegendLow}</span>
                <span>{t.heatmapLegendHigh} →</span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">{t.compareTitle}</h3>
              <p className="text-muted-foreground text-xs">{t.compareDesc}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Textarea
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                  placeholder={t.textAPlaceholder}
                  className="min-h-16 resize-y text-sm"
                />
                <Textarea
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  placeholder={t.textBPlaceholder}
                  className="min-h-16 resize-y text-sm"
                />
              </div>
              {similarity !== null && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.similarityLabel}</span>
                    <span className="font-semibold tabular-nums">
                      {Math.round(similarity * 100)}% — {similarityLabel(similarity)}
                    </span>
                  </div>
                  <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-500 transition-[width]"
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
