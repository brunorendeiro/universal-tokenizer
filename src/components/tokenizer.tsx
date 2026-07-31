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

const DEFAULT_MODEL_ID = MODELS[0].id;
const COMPARE_MODEL_ID = MODELS[2]?.id ?? MODELS[0].id;
const SAMPLE_TEXT =
  "Cola aqui o teu prompt para veres quantos tokens cada modelo usa — e quanto custaria.";
const DEBOUNCE_MS = 250;

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

function formatNumber(n: number) {
  return new Intl.NumberFormat("pt-PT").format(n);
}

function formatCost(n: number) {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `< $0.01`;
  return `$${n.toFixed(2)}`;
}

export function Tokenizer() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedId, setSelectedId] = useState(DEFAULT_MODEL_ID);
  const [compareMode, setCompareMode] = useState(false);
  const [compareId, setCompareId] = useState(COMPARE_MODEL_ID);
  const [rows, setRows] = useState<Record<string, Row>>(emptyRows);

  const request = useTokenizerWorker();
  // Guards against a slow response from an earlier keystroke overwriting a
  // newer one — only the latest debounce "generation" is allowed to apply.
  const generationRef = useRef(0);

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
            <CardTitle>O teu texto</CardTitle>
            <CardDescription>
              Escreve ou cola o prompt — a contagem atualiza automaticamente
              para todos os modelos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreve aqui..."
              className="min-h-32 resize-y font-mono text-sm"
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {formatNumber(text.length)} caracteres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Modelo</CardTitle>
              <CardDescription>
                {compareMode
                  ? "Compara dois modelos lado a lado."
                  : "Escolhe o modelo para ver o detalhe."}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCompareMode((v) => !v)}
            >
              {compareMode ? "A comparar" : "Comparar 2 modelos"}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div
              className={`grid gap-6 ${compareMode ? "xl:grid-cols-2" : "grid-cols-1"}`}
            >
              <ModelPanel
                model={selectedModel}
                selectedId={selectedId}
                onSelect={setSelectedId}
                row={rows[selectedId]}
                text={text}
              />
              {compareMode && (
                <ModelPanel
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
          <CardTitle>Eficiência de tokenização</CardTitle>
          <CardDescription>
            Mesma frase, tokenizers diferentes — menos tokens = mais barato
            para este texto. (Não mede velocidade nem qualidade da resposta —
            só quanto cada modelo &quot;paga&quot; para ler este prompt.)
          </CardDescription>
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
  model,
  selectedId,
  onSelect,
  row,
  text,
}: {
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
          <SelectValue placeholder="Escolhe um modelo" />
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
          {model.accuracy === "exact" ? "Exato" : "≈ Estimado"}
        </Badge>
        {model.contextWindow && (
          <Badge variant="outline">
            Contexto: {formatNumber(model.contextWindow)}
          </Badge>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Tokens"
          value={row?.status === "ready" ? formatNumber(row.tokens) : "…"}
        />
        <Stat label="Caracteres" value={formatNumber(text.length)} />
        <Stat
          label="Custo estimado (input)"
          value={cost !== null ? formatCost(cost) : "—"}
        />
        {model.contextWindow && row?.status === "ready" && (
          <Stat
            label="% da janela"
            value={`${((row.tokens / model.contextWindow) * 100).toFixed(2)}%`}
          />
        )}
      </div>

      {model.note && <p className="text-muted-foreground text-xs">{model.note}</p>}

      <div>
        <p className="mb-2 text-xs font-medium">
          Cada bloco colorido abaixo é um token — assim é que o modelo &quot;vê&quot; o teu texto.
        </p>
        <TokenVisualizer
          segments={row?.segments ?? []}
          overflow={row?.overflow ?? false}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
