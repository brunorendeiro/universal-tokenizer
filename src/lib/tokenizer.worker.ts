/// <reference lib="webworker" />

// Runs entirely off the main thread. tiktoken and the Hugging Face
// tokenizers can be CPU-heavy (large vocabularies, big rank tables) —
// keeping them here means typing never freezes the UI, no matter which
// model is selected.

import { MODELS } from "@/lib/models";
import { idsToSegments } from "@/lib/token-segments";

type LiteTiktoken = import("js-tiktoken/lite").Tiktoken;
type HfTokenizer = import("@huggingface/transformers").PreTrainedTokenizer;

const tiktokenCache = new Map<string, Promise<LiteTiktoken>>();
const hfTokenizerCache = new Map<string, Promise<HfTokenizer>>();

// Above this many tokens, per-token decode-diffing (O(n^2)) gets slow —
// fall back to a plain count for huge inputs and skip the segment breakdown.
const MAX_SEGMENTS = 800;

async function getTiktokenEncoder(
  encoding: "o200k_base" | "cl100k_base" | "gpt2",
): Promise<LiteTiktoken> {
  let cached = tiktokenCache.get(encoding);
  if (!cached) {
    cached = (async () => {
      const [{ Tiktoken }, ranksModule] = await Promise.all([
        import("js-tiktoken/lite"),
        encoding === "o200k_base"
          ? import("js-tiktoken/ranks/o200k_base")
          : encoding === "cl100k_base"
            ? import("js-tiktoken/ranks/cl100k_base")
            : import("js-tiktoken/ranks/gpt2"),
      ]);
      return new Tiktoken(ranksModule.default);
    })();
    tiktokenCache.set(encoding, cached);
  }
  return cached;
}

async function getHfTokenizer(repo: string): Promise<HfTokenizer> {
  let cached = hfTokenizerCache.get(repo);
  if (!cached) {
    cached = (async () => {
      const { AutoTokenizer } = await import("@huggingface/transformers");
      return AutoTokenizer.from_pretrained(repo);
    })();
    hfTokenizerCache.set(repo, cached);
  }
  return cached;
}

export interface WorkerRequest {
  requestId: string;
  modelId: string;
  text: string;
}

export interface WorkerResponse {
  requestId: string;
  modelId: string;
  tokens: number;
  /** Empty when the input is too long to break down cheaply — see MAX_SEGMENTS. */
  segments: string[];
  error?: string;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { requestId, modelId, text } = event.data;
  const respond = (payload: Omit<WorkerResponse, "requestId" | "modelId">) =>
    self.postMessage({ requestId, modelId, ...payload } satisfies WorkerResponse);

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) {
    respond({ tokens: 0, segments: [], error: "unknown model" });
    return;
  }
  if (text.length === 0) {
    respond({ tokens: 0, segments: [] });
    return;
  }

  try {
    let ids: number[];
    let decode: (slice: number[]) => string;

    if (model.engine.kind === "hf") {
      const tokenizer = await getHfTokenizer(model.engine.repo);
      ids = Array.from(tokenizer.encode(text, { add_special_tokens: false }));
      decode = (slice) => tokenizer.decode(slice, { skip_special_tokens: true });
    } else {
      const encoder = await getTiktokenEncoder(model.engine.encoding);
      ids = encoder.encode(text);
      decode = (slice) => encoder.decode(slice);
    }

    const segments = ids.length <= MAX_SEGMENTS ? idsToSegments(ids, decode) : [];
    respond({ tokens: ids.length, segments });
  } catch (err) {
    respond({ tokens: 0, segments: [], error: err instanceof Error ? err.message : String(err) });
  }
};
