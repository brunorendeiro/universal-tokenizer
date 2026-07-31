"use client";

import { useEffect, useState } from "react";

export type Locale = "pt" | "en" | "de";

export const LOCALES: Locale[] = ["en", "pt", "de"];

const STORAGE_KEY = "universal-tokenizer-locale";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "pt" || stored === "en" || stored === "de") return stored;
  const nav = window.navigator.language.slice(0, 2).toLowerCase();
  if (nav === "pt" || nav === "de") return nav;
  return "en";
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // Deliberately deferred to an effect: detectLocale() reads localStorage,
    // which isn't available during SSR. Running it during render would
    // desync the client's first paint from the server-rendered HTML
    // (hydration mismatch) — the one-render delay here is the trade-off.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(detectLocale());
  }, []);

  function setLocale(next: Locale) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }

  return { locale, setLocale };
}

export type NoteKey =
  | "openWeights"
  | "openWeightsFull"
  | "openWeightsGoogle"
  | "historical"
  | "approxNoPublicTokenizer";

type UiStrings = {
  heroTitle: string;
  heroSubtitle: string;
  yourTextTitle: string;
  yourTextDesc: string;
  textareaPlaceholder: string;
  charCount: (n: string) => string;
  modelTitle: string;
  modelDescSingle: string;
  modelDescCompare: string;
  compareToggleOn: string;
  compareToggleOff: string;
  choosePlaceholder: string;
  badgeExact: string;
  badgeApprox: string;
  contextBadge: (n: string) => string;
  statTokens: string;
  statChars: string;
  statCost: string;
  statContextPct: string;
  visualizerHint: string;
  visualizerEmpty: string;
  visualizerOverflow: string;
  efficiencyTitle: string;
  efficiencyDesc: string;
  footerNote: (models: string) => string;
  createdBy: string;
  poweredBy: string;
  cookieBody: string;
  cookieAccept: string;
  cookieReject: string;
  notes: Record<NoteKey, string>;
};

export const ui: Record<Locale, UiStrings> = {
  en: {
    heroTitle: "Universal Tokenizer",
    heroSubtitle:
      "Count tokens, see the exact split, and estimate costs for GPT, Claude, Gemini, Llama, Mistral, Qwen and more — all local in your browser, no API key.",
    yourTextTitle: "Your text",
    yourTextDesc:
      "Type or paste your prompt — the count updates automatically for every model.",
    textareaPlaceholder: "Type here...",
    charCount: (n) => `${n} characters`,
    modelTitle: "Model",
    modelDescSingle: "Choose a model to see the detail.",
    modelDescCompare: "Compare two models side by side.",
    compareToggleOn: "Comparing",
    compareToggleOff: "Compare 2 models",
    choosePlaceholder: "Choose a model",
    badgeExact: "Exact",
    badgeApprox: "≈ Estimated",
    contextBadge: (n) => `Context: ${n}`,
    statTokens: "Tokens",
    statChars: "Characters",
    statCost: "Estimated cost (input)",
    statContextPct: "% of context window",
    visualizerHint:
      "Each colored block below is a token — this is how the model “sees” your text.",
    visualizerEmpty: "Type something to see the highlighted tokens here.",
    visualizerOverflow:
      "Text too long to show each individual token — but the count above is still exact.",
    efficiencyTitle: "Tokenization efficiency",
    efficiencyDesc:
      "Same sentence, different tokenizers — fewer tokens = cheaper for this text. (Doesn't measure speed or response quality — only how much each model “pays” to read this prompt.)",
    footerNote: (models) =>
      `${models} use their real public tokenizer (exact count). The other providers don't publish theirs — those values are an estimate.`,
    createdBy: "Created by Bruno Rendeiro",
    poweredBy: "⚡ Powered by AI",
    cookieBody:
      "I use Google Analytics to understand how many people visit this app. Do you accept analytics cookies?",
    cookieAccept: "Accept",
    cookieReject: "Reject",
    notes: {
      openWeights: "Free to run locally (open weights).",
      openWeightsFull: "Fully open-source (weights, data and training code).",
      openWeightsGoogle: "Google's open-weight model — different from Gemini (closed).",
      historical: "Historical model (2019) — tokenizer has always been public.",
      approxNoPublicTokenizer:
        "This provider doesn't publish a tokenizer — count is estimated.",
    },
  },
  pt: {
    heroTitle: "Universal Tokenizer",
    heroSubtitle:
      "Conta tokens, mostra a separação exata e estima custos para GPT, Claude, Gemini, Llama, Mistral, Qwen e mais — tudo local no browser, sem chave de API.",
    yourTextTitle: "O teu texto",
    yourTextDesc:
      "Escreve ou cola o prompt — a contagem atualiza automaticamente para todos os modelos.",
    textareaPlaceholder: "Escreve aqui...",
    charCount: (n) => `${n} caracteres`,
    modelTitle: "Modelo",
    modelDescSingle: "Escolhe o modelo para ver o detalhe.",
    modelDescCompare: "Compara dois modelos lado a lado.",
    compareToggleOn: "A comparar",
    compareToggleOff: "Comparar 2 modelos",
    choosePlaceholder: "Escolhe um modelo",
    badgeExact: "Exato",
    badgeApprox: "≈ Estimado",
    contextBadge: (n) => `Contexto: ${n}`,
    statTokens: "Tokens",
    statChars: "Caracteres",
    statCost: "Custo estimado (input)",
    statContextPct: "% da janela de contexto",
    visualizerHint:
      "Cada bloco colorido abaixo é um token — assim é que o modelo “vê” o teu texto.",
    visualizerEmpty: "Escreve algo para veres os tokens destacados aqui.",
    visualizerOverflow:
      "Texto demasiado grande para mostrar cada token individualmente — mas a contagem acima continua exata.",
    efficiencyTitle: "Eficiência de tokenização",
    efficiencyDesc:
      "Mesma frase, tokenizers diferentes — menos tokens = mais barato para este texto. (Não mede velocidade nem qualidade da resposta — só quanto cada modelo “paga” para ler este prompt.)",
    footerNote: (models) =>
      `${models} usam o tokenizer público real (contagem exata). Os outros fornecedores não publicam o seu — esses valores são uma estimativa.`,
    createdBy: "Criado por Bruno Rendeiro",
    poweredBy: "⚡ Powered by AI",
    cookieBody:
      "Uso o Google Analytics para perceber quantas pessoas visitam esta app. Aceitas cookies de análise?",
    cookieAccept: "Aceitar",
    cookieReject: "Rejeitar",
    notes: {
      openWeights: "Grátis para correr localmente (pesos abertos).",
      openWeightsFull: "Totalmente open-source (pesos, dados e código de treino).",
      openWeightsGoogle: "Modelo de pesos abertos da Google — diferente do Gemini (fechado).",
      historical: "Modelo histórico (2019) — tokenizer público desde sempre.",
      approxNoPublicTokenizer:
        "Este fornecedor não publica um tokenizer — contagem estimada.",
    },
  },
  de: {
    heroTitle: "Universal Tokenizer",
    heroSubtitle:
      "Zähle Tokens, sieh die genaue Aufteilung und schätze Kosten für GPT, Claude, Gemini, Llama, Mistral, Qwen und mehr — alles lokal im Browser, ohne API-Schlüssel.",
    yourTextTitle: "Dein Text",
    yourTextDesc:
      "Schreib oder füg deinen Prompt ein — die Zählung aktualisiert sich automatisch für jedes Modell.",
    textareaPlaceholder: "Hier schreiben...",
    charCount: (n) => `${n} Zeichen`,
    modelTitle: "Modell",
    modelDescSingle: "Wähle ein Modell für die Details.",
    modelDescCompare: "Vergleiche zwei Modelle nebeneinander.",
    compareToggleOn: "Vergleich aktiv",
    compareToggleOff: "2 Modelle vergleichen",
    choosePlaceholder: "Modell wählen",
    badgeExact: "Exakt",
    badgeApprox: "≈ Geschätzt",
    contextBadge: (n) => `Kontext: ${n}`,
    statTokens: "Tokens",
    statChars: "Zeichen",
    statCost: "Geschätzte Kosten (Input)",
    statContextPct: "% des Kontextfensters",
    visualizerHint:
      "Jeder farbige Block unten ist ein Token — so “sieht” das Modell deinen Text.",
    visualizerEmpty: "Schreib etwas, um die hervorgehobenen Tokens hier zu sehen.",
    visualizerOverflow:
      "Text zu lang, um jedes einzelne Token anzuzeigen — die Zählung oben bleibt aber exakt.",
    efficiencyTitle: "Tokenisierungs-Effizienz",
    efficiencyDesc:
      "Gleicher Satz, unterschiedliche Tokenizer — weniger Tokens = günstiger für diesen Text. (Misst nicht Geschwindigkeit oder Antwortqualität — nur wie viel jedes Modell “zahlt”, um diesen Prompt zu lesen.)",
    footerNote: (models) =>
      `${models} nutzen ihren echten öffentlichen Tokenizer (exakte Zählung). Die anderen Anbieter veröffentlichen ihren nicht — diese Werte sind eine Schätzung.`,
    createdBy: "Erstellt von Bruno Rendeiro",
    poweredBy: "⚡ Powered by AI",
    cookieBody:
      "Ich nutze Google Analytics, um zu verstehen, wie viele Personen diese App besuchen. Akzeptierst du Analyse-Cookies?",
    cookieAccept: "Akzeptieren",
    cookieReject: "Ablehnen",
    notes: {
      openWeights: "Kostenlos lokal ausführbar (offene Gewichte).",
      openWeightsFull: "Vollständig Open-Source (Gewichte, Daten und Trainingscode).",
      openWeightsGoogle: "Googles offenes Modell — anders als Gemini (geschlossen).",
      historical: "Historisches Modell (2019) — Tokenizer war schon immer öffentlich.",
      approxNoPublicTokenizer:
        "Dieser Anbieter veröffentlicht keinen Tokenizer — Zählung geschätzt.",
    },
  },
};
