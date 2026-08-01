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
    const detected = detectLocale();
    document.documentElement.lang = detected;
    const handle = window.setTimeout(() => setLocaleState(detected), 0);
    return () => window.clearTimeout(handle);
  }, []);

  function setLocale(next: Locale) {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
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
  eyebrow: string;
  brandSubtitle: string;
  engineOnline: string;
  sectionsLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  navWorkbench: string;
  navEmbeddings: string;
  navAgents: string;
  localBadge: string;
  modelProfiles: (n: number) => string;
  exactTokenizers: (n: number) => string;
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
  statContextPctHint: string;
  contextExplainerTitle: (percentage: string) => string;
  contextExplainerBody: (used: string, total: string) => string;
  visualizerHint: string;
  visualizerEmpty: string;
  visualizerOverflow: string;
  clearText: string;
  copyText: string;
  copiedText: string;
  responseBudgetLabel: string;
  responseBudgetHint: string;
  statInputCost: string;
  statOutputCost: string;
  statTotalCost: string;
  plainTextNotice: string;
  loadExactModels: string;
  loadingExactModels: string;
  tokenizerIdle: string;
  tokenizerError: string;
  retry: string;
  exactMethod: string;
  proxyMethod: string;
  efficiencyTitle: string;
  efficiencyDesc: string;
  footerNote: (models: string) => string;
  createdBy: string;
  poweredBy: string;
  cookieBody: string;
  cookieAccept: string;
  cookieReject: string;
  notes: Record<NoteKey, string>;
  embeddings: {
    title: string;
    subtitle: string;
    disclaimer: string;
    activateButton: string;
    loading: (pct: string) => string;
    cloudTitle: string;
    cloudDesc: string;
    cloudDragHint: string;
    cloudColorHint: string;
    compareTitle: string;
    compareDesc: string;
    textAPlaceholder: string;
    textBPlaceholder: string;
    similarityLabel: string;
    similarityVeryHigh: string;
    similarityHigh: string;
    similarityMedium: string;
    similarityLow: string;
  };
  agentInfo: {
    eyebrow: string;
    title: string;
    intro: string;
    points: string[];
  };
};

export const ui: Record<Locale, UiStrings> = {
  en: {
    eyebrow: "Token analysis and cost forecasting",
    brandSubtitle: "Tokenizer & cost calculator",
    engineOnline: "Local processing ready",
    sectionsLabel: "Application sections",
    heroTitle: "Universal Tokenizer",
    heroSubtitle:
      "Inspect how models read your prompt, compare token efficiency, and forecast input and output cost — privately, inside your browser.",
    navWorkbench: "Token workbench",
    navEmbeddings: "Semantic lab",
    navAgents: "Agent guide",
    localBadge: "Text never leaves this browser",
    modelProfiles: (n) => `${n} model profiles`,
    exactTokenizers: (n) => `${n} exact tokenizers`,
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
    statContextPctHint:
      "The context window is the maximum amount of text a model can “see” at once (input + output). This shows how much of that limit your current prompt uses.",
    contextExplainerTitle: (percentage) => `What does ${percentage} mean?`,
    contextExplainerBody: (used, total) =>
      `Think of the context window as the model's working memory. This model can hold up to ${total} tokens at once; your text uses ${used}. The closer this gets to 100%, the less room remains for the reply and conversation history.`,
    visualizerHint:
      "Each colored block below is a token — this is how the model “sees” your text.",
    visualizerEmpty: "Type something to see the highlighted tokens here.",
    visualizerOverflow:
      "Text too long to show each individual token — but the count above is still exact.",
    clearText: "Clear",
    copyText: "Copy",
    copiedText: "Copied",
    responseBudgetLabel: "Expected response",
    responseBudgetHint: "Used to forecast output and total cost. It does not change the token count above.",
    statInputCost: "Prompt cost",
    statOutputCost: "Response cost",
    statTotalCost: "Estimated total",
    plainTextNotice:
      "Exact means exact for the text above. API message wrappers, system prompts, tools and hidden provider metadata can add billable tokens.",
    loadExactModels: "Load every open tokenizer",
    loadingExactModels: "Loading open tokenizers…",
    tokenizerIdle: "On demand",
    tokenizerError: "Unavailable",
    retry: "Retry",
    exactMethod: "Uses the model's public tokenizer locally in this browser.",
    proxyMethod: "Proxy estimate using o200k_base; it is not the provider's private tokenizer.",
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
    embeddings: {
      title: "How AI understands meaning",
      subtitle:
        "Tokens are just how text gets split. This is what happens next: each token becomes a list of numbers (a vector) that captures its meaning.",
      disclaimer:
        "This uses a small general-purpose embedding model (all-MiniLM-L6-v2), not the model whose tokenizer you picked above — there's no public way to see GPT/Claude/Gemini's real internal vectors, since that needs their private weights. This demonstrates the same underlying concept with an open model instead.",
      activateButton: "Show vectors (downloads a ~90MB model, once)",
      loading: (pct) => `Loading model… ${pct}%`,
      cloudTitle: "3D map of meaning",
      cloudDesc:
        "Each token becomes a point in 3D space (reduced from 384 dimensions down to 3 with PCA) — words with similar meaning end up closer together.",
      cloudDragHint: "Drag to rotate — it also spins on its own",
      cloudColorHint: "Color shows each token's vector strength — a stand-in \"4th dimension\" you can see.",
      compareTitle: "How similar are these two sentences?",
      compareDesc:
        "Semantic similarity — this compares meaning, not shared words. Try two very different sentences that mean the same thing. Works best with English text (the model was trained on English).",
      textAPlaceholder: "First sentence...",
      textBPlaceholder: "Second sentence...",
      similarityLabel: "Semantic similarity",
      similarityVeryHigh: "Nearly the same meaning",
      similarityHigh: "Related meaning",
      similarityMedium: "Loosely related",
      similarityLow: "Unrelated",
    },
    agentInfo: {
      eyebrow: "Context economics",
      title: "Tokenizer vs. AI agents",
      intro:
        "This app counts tokens for one prompt at a time. An \"agent\" is a model running in a loop, deciding on its own to call tools (read files, run code, search the web...) many times in a row without a human typing each step — but under the hood, every one of those turns is still just a request, tokenized and priced the same way.",
      points: [
        "Same base cost: $ per million input tokens + $ per million output tokens, set by the model.",
        "The conversation grows every turn — since models have no memory of their own, each new request resends the entire history so far, so later turns cost more just to \"re-read\" everything.",
        "Tool use counts too — both the agent's request to use a tool and the result that tool returns are tokens, and get billed.",
        "\"Thinking\" is billed output — reasoning tokens are charged even when you don't see the full raw reasoning.",
        "Caching helps — repeated parts of the conversation can cost as little as ~10% of the normal price instead of full price again.",
      ],
    },
  },
  pt: {
    eyebrow: "Análise de tokens e previsão de custos",
    brandSubtitle: "Tokenizer e calculadora de custos",
    engineOnline: "Processamento local pronto",
    sectionsLabel: "Secções da aplicação",
    heroTitle: "Universal Tokenizer",
    heroSubtitle:
      "Vê como os modelos leem o teu prompt, compara eficiência e prevê custos de entrada e resposta — com privacidade, dentro do browser.",
    navWorkbench: "Workbench de tokens",
    navEmbeddings: "Laboratório semântico",
    navAgents: "Guia de agentes",
    localBadge: "O texto nunca sai deste browser",
    modelProfiles: (n) => `${n} perfis de modelo`,
    exactTokenizers: (n) => `${n} tokenizers exatos`,
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
    statContextPctHint:
      "A janela de contexto é a quantidade máxima de texto que um modelo consegue “ver” de uma vez (input + resposta). Isto mostra quanto desse limite o teu prompt atual está a usar.",
    contextExplainerTitle: (percentage) => `O que significa ${percentage}?`,
    contextExplainerBody: (used, total) =>
      `Pensa na janela de contexto como a memória de trabalho do modelo. Este modelo consegue guardar até ${total} tokens de uma vez; o teu texto usa ${used}. Quanto mais perto chegar dos 100%, menos espaço sobra para a resposta e para o histórico da conversa.`,
    visualizerHint:
      "Cada bloco colorido abaixo é um token — assim é que o modelo “vê” o teu texto.",
    visualizerEmpty: "Escreve algo para veres os tokens destacados aqui.",
    visualizerOverflow:
      "Texto demasiado grande para mostrar cada token individualmente — mas a contagem acima continua exata.",
    clearText: "Limpar",
    copyText: "Copiar",
    copiedText: "Copiado",
    responseBudgetLabel: "Resposta esperada",
    responseBudgetHint: "Serve para prever o custo de output e o total. Não altera a contagem acima.",
    statInputCost: "Custo do prompt",
    statOutputCost: "Custo da resposta",
    statTotalCost: "Total estimado",
    plainTextNotice:
      "Exato significa exato para o texto acima. O envelope da API, system prompts, ferramentas e metadados do fornecedor podem acrescentar tokens cobrados.",
    loadExactModels: "Carregar todos os tokenizers abertos",
    loadingExactModels: "A carregar tokenizers abertos…",
    tokenizerIdle: "A pedido",
    tokenizerError: "Indisponível",
    retry: "Tentar novamente",
    exactMethod: "Usa localmente o tokenizer público real deste modelo.",
    proxyMethod: "Estimativa proxy com o200k_base; não é o tokenizer privado do fornecedor.",
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
    embeddings: {
      title: "Como a IA entende significado",
      subtitle:
        "Os tokens são só como o texto é cortado. Isto é o que acontece a seguir: cada token vira uma lista de números (um vetor) que representa o seu significado.",
      disclaimer:
        "Isto usa um modelo de embeddings pequeno e genérico (all-MiniLM-L6-v2), não o modelo cujo tokenizer escolheste em cima — não existe forma pública de ver os vetores internos reais do GPT/Claude/Gemini, isso precisa dos pesos privados deles. Isto demonstra o mesmo conceito com um modelo aberto.",
      activateButton: "Mostrar vetores (descarrega um modelo de ~90MB, uma vez)",
      loading: (pct) => `A carregar modelo… ${pct}%`,
      cloudTitle: "Mapa 3D do significado",
      cloudDesc:
        "Cada token vira um ponto no espaço 3D (reduzido de 384 dimensões para só 3, via PCA) — palavras com significado parecido acabam mais próximas.",
      cloudDragHint: "Arrasta para rodar — também gira sozinho",
      cloudColorHint: "A cor mostra a intensidade do vetor de cada token — uma \"4ª dimensão\" que dá para ver.",
      compareTitle: "Quão parecidas são estas duas frases?",
      compareDesc:
        "Semelhança semântica — compara significado, não palavras em comum. Experimenta duas frases muito diferentes que querem dizer o mesmo. Funciona melhor com texto em inglês (o modelo foi treinado em inglês).",
      textAPlaceholder: "Primeira frase...",
      textBPlaceholder: "Segunda frase...",
      similarityLabel: "Semelhança semântica",
      similarityVeryHigh: "Quase o mesmo significado",
      similarityHigh: "Significado relacionado",
      similarityMedium: "Vagamente relacionado",
      similarityLow: "Sem relação",
    },
    agentInfo: {
      eyebrow: "Economia de contexto",
      title: "Tokenizer vs. agentes de IA",
      intro:
        "Esta app conta tokens para um prompt de cada vez. Um \"agente\" é um modelo a correr em ciclo, que decide sozinho chamar ferramentas (ler ficheiros, correr código, pesquisar na web...) várias vezes seguidas, sem um humano escrever cada passo — mas por baixo, cada uma dessas voltas continua a ser só um pedido, tokenizado e cobrado da mesma forma.",
      points: [
        "Mesma base de custo: $ por milhão de tokens de entrada + $ por milhão de tokens de saída, conforme o modelo.",
        "A conversa cresce a cada volta — como os modelos não têm memória própria, cada novo pedido reenvia todo o histórico até ali, por isso as voltas seguintes custam mais só para \"reler\" tudo.",
        "As ferramentas também contam — tanto o pedido do agente para usar uma ferramenta como o resultado que ela devolve são tokens, e são cobrados.",
        "\"Pensar\" é output cobrado — os tokens de raciocínio são cobrados mesmo quando não vês o raciocínio completo.",
        "O caching ajuda — partes repetidas da conversa podem custar só ~10% do preço normal, em vez de pagares tudo outra vez.",
      ],
    },
  },
  de: {
    eyebrow: "Tokenanalyse und Kostenprognose",
    brandSubtitle: "Tokenizer & Kostenrechner",
    engineOnline: "Lokale Verarbeitung bereit",
    sectionsLabel: "Anwendungsbereiche",
    heroTitle: "Universal Tokenizer",
    heroSubtitle:
      "Sieh, wie Modelle deinen Prompt lesen, vergleiche Token-Effizienz und prognostiziere Ein- und Ausgabekosten — privat in deinem Browser.",
    navWorkbench: "Token-Workbench",
    navEmbeddings: "Semantik-Labor",
    navAgents: "Agenten-Guide",
    localBadge: "Text verlässt diesen Browser nie",
    modelProfiles: (n) => `${n} Modellprofile`,
    exactTokenizers: (n) => `${n} exakte Tokenizer`,
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
    statContextPctHint:
      "Das Kontextfenster ist die maximale Textmenge, die ein Modell auf einmal “sehen” kann (Input + Output). Dies zeigt, wie viel von diesem Limit dein aktueller Prompt nutzt.",
    contextExplainerTitle: (percentage) => `Was bedeutet ${percentage}?`,
    contextExplainerBody: (used, total) =>
      `Stell dir das Kontextfenster als Arbeitsgedächtnis des Modells vor. Dieses Modell kann bis zu ${total} Tokens gleichzeitig halten; dein Text nutzt ${used}. Je näher der Wert an 100% kommt, desto weniger Platz bleibt für die Antwort und den Gesprächsverlauf.`,
    visualizerHint:
      "Jeder farbige Block unten ist ein Token — so “sieht” das Modell deinen Text.",
    visualizerEmpty: "Schreib etwas, um die hervorgehobenen Tokens hier zu sehen.",
    visualizerOverflow:
      "Text zu lang, um jedes einzelne Token anzuzeigen — die Zählung oben bleibt aber exakt.",
    clearText: "Leeren",
    copyText: "Kopieren",
    copiedText: "Kopiert",
    responseBudgetLabel: "Erwartete Antwort",
    responseBudgetHint: "Dient zur Prognose der Output- und Gesamtkosten. Die Tokenzahl oben bleibt unverändert.",
    statInputCost: "Prompt-Kosten",
    statOutputCost: "Antwortkosten",
    statTotalCost: "Geschätzte Summe",
    plainTextNotice:
      "Exakt bedeutet exakt für den Text oben. API-Nachrichtenrahmen, System-Prompts, Tools und Anbieter-Metadaten können zusätzliche Tokens verursachen.",
    loadExactModels: "Alle offenen Tokenizer laden",
    loadingExactModels: "Offene Tokenizer werden geladen…",
    tokenizerIdle: "Bei Bedarf",
    tokenizerError: "Nicht verfügbar",
    retry: "Erneut versuchen",
    exactMethod: "Verwendet den öffentlichen Tokenizer dieses Modells lokal im Browser.",
    proxyMethod: "Proxy-Schätzung mit o200k_base; nicht der private Tokenizer des Anbieters.",
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
    embeddings: {
      title: "Wie KI Bedeutung versteht",
      subtitle:
        "Tokens sind nur, wie Text aufgeteilt wird. Das passiert als Nächstes: Jedes Token wird zu einer Zahlenliste (einem Vektor), die seine Bedeutung erfasst.",
      disclaimer:
        "Dies nutzt ein kleines, allgemeines Embedding-Modell (all-MiniLM-L6-v2), nicht das Modell, dessen Tokenizer du oben gewählt hast — es gibt keine öffentliche Möglichkeit, die echten internen Vektoren von GPT/Claude/Gemini zu sehen, das erfordert ihre privaten Gewichte. Dies zeigt dasselbe Konzept stattdessen mit einem offenen Modell.",
      activateButton: "Vektoren anzeigen (lädt einmalig ein ~90MB-Modell)",
      loading: (pct) => `Modell wird geladen… ${pct}%`,
      cloudTitle: "3D-Karte der Bedeutung",
      cloudDesc:
        "Jedes Token wird zu einem Punkt im 3D-Raum (von 384 Dimensionen auf nur 3 reduziert, per PCA) — Wörter mit ähnlicher Bedeutung landen näher beieinander.",
      cloudDragHint: "Zum Drehen ziehen — dreht sich auch von selbst",
      cloudColorHint: "Die Farbe zeigt die Vektorstärke jedes Tokens — eine sichtbare \"4. Dimension\".",
      compareTitle: "Wie ähnlich sind diese zwei Sätze?",
      compareDesc:
        "Semantische Ähnlichkeit — vergleicht Bedeutung, nicht gemeinsame Wörter. Probier zwei sehr unterschiedliche Sätze mit derselben Bedeutung. Funktioniert am besten mit englischem Text (das Modell wurde auf Englisch trainiert).",
      textAPlaceholder: "Erster Satz...",
      textBPlaceholder: "Zweiter Satz...",
      similarityLabel: "Semantische Ähnlichkeit",
      similarityVeryHigh: "Fast dieselbe Bedeutung",
      similarityHigh: "Verwandte Bedeutung",
      similarityMedium: "Locker verwandt",
      similarityLow: "Unabhängig",
    },
    agentInfo: {
      eyebrow: "Kontextökonomie",
      title: "Tokenizer vs. KI-Agenten",
      intro:
        "Diese App zählt Tokens für jeweils einen Prompt. Ein \"Agent\" ist ein Modell, das in einer Schleife läuft und selbst entscheidet, Werkzeuge zu nutzen (Dateien lesen, Code ausführen, im Web suchen...) — viele Male hintereinander, ohne dass ein Mensch jeden Schritt eintippt. Aber im Hintergrund ist jede dieser Runden immer noch nur eine Anfrage, genauso tokenisiert und abgerechnet.",
      points: [
        "Gleiche Basiskosten: $ pro Million Input-Tokens + $ pro Million Output-Tokens, je nach Modell.",
        "Das Gespräch wächst mit jeder Runde — da Modelle kein eigenes Gedächtnis haben, wird bei jeder neuen Anfrage der gesamte bisherige Verlauf erneut gesendet, spätere Runden kosten also mehr nur fürs \"Nachlesen\".",
        "Werkzeugnutzung zählt auch — sowohl die Anfrage des Agenten, ein Werkzeug zu nutzen, als auch dessen Ergebnis sind Tokens und werden abgerechnet.",
        "\"Denken\" ist abgerechneter Output — Reasoning-Tokens werden berechnet, auch wenn du das vollständige Reasoning nicht siehst.",
        "Caching hilft — wiederholte Teile des Gesprächs können nur ~10% des normalen Preises kosten, statt erneut voll bezahlt zu werden.",
      ],
    },
  },
};
