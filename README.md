# Universal Tokenizer

A desktop-first token intelligence workbench for inspecting prompts, comparing tokenizer efficiency, and forecasting LLM input and output costs. Everything runs in the browser; no API key or application backend is required.

## What it includes

- Exact local tokenization for public tokenizers from OpenAI and open-weight models.
- Clearly labelled proxy estimates for providers without a public local tokenizer.
- Per-token visualization, context-window usage, and model comparison.
- Input, expected-output, and combined cost forecasts.
- An opt-in semantic lab powered by `all-MiniLM-L6-v2`, with 3D PCA projection and cosine similarity.
- A concise guide to how tokens accumulate in tool-using AI agents.
- English, Portuguese, and German interfaces.

## Accuracy model

`Exact` means the visible text was processed with the model family's public tokenizer. It does not include API message wrappers, system prompts, tool definitions, hidden provider metadata, or a generated response.

`Estimated` means the provider does not expose a tokenizer that can be used locally. These profiles currently use `o200k_base` as a transparent proxy and should not be interpreted as the provider's official count.

Pricing is stored in `src/lib/models.ts`. Provider prices and context windows change over time, so they should be verified before each release.

## Privacy and downloads

Prompt text is processed inside Web Workers and is not sent to an application server. Public tokenizer files and the optional embedding model may be downloaded from their upstream repositories and cached by the browser.

Google Analytics is loaded only after explicit consent. Declining consent leaves analytics unloaded.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm test
npm run build
```

The production build is statically generated. Use `npm run start` after a build for production-like browser testing.

## Architecture

- `src/components/tokenizer.tsx` — workbench, cost forecast, and comparison UI.
- `src/lib/tokenizer.worker.ts` — tokenizer loading, caching, and off-main-thread execution.
- `src/components/embedding-visualizer.tsx` — opt-in semantic lab.
- `src/lib/embedding.worker.ts` — model download and embedding inference.
- `src/lib/models.ts` — model catalogue, engines, prices, and context windows.
- `src/lib/i18n.ts` — locale detection and UI copy.

The Semantic Lab is dynamically imported and its model is only requested after user activation. Open-weight tokenizers are loaded on demand; users can explicitly load the complete comparison set.

## Adding a model

Add a `ModelDef` entry to `src/lib/models.ts` with:

- a stable application ID;
- an explicit provider and display label;
- the tokenizer engine and accuracy classification;
- context window and pricing, when verified;
- an explanatory note for approximate or open-weight models.

Do not label a tokenizer as exact unless its tokenizer files or encoding are publicly available and locally reproducible.
