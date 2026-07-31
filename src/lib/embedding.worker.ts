/// <reference lib="webworker" />

// A general-purpose sentence-embedding model — NOT the tokenizer's own
// model. There's no public way to pull real per-token embeddings out of
// GPT/Claude/Gemini/etc. (that requires their private weights), so this
// demonstrates the underlying concept with a small open model instead.
// Runs in its own worker since the ~90MB model download and inference are
// heavier than plain tokenization.

import { idsToSegments } from "@/lib/token-segments";

const MODEL_ID = "onnx-community/all-MiniLM-L6-v2-ONNX";

type Extractor = import("@huggingface/transformers").FeatureExtractionPipeline;

let extractorPromise: Promise<Extractor> | null = null;

async function getExtractor(
  onProgress: (loaded: number, total: number) => void,
): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      return pipeline("feature-extraction", MODEL_ID, {
        progress_callback: (info: { status: string; loaded?: number; total?: number }) => {
          if (info.status === "progress" && info.loaded != null && info.total != null) {
            onProgress(info.loaded, info.total);
          }
        },
      });
    })();
  }
  return extractorPromise;
}

interface TokenEmbeddingRequest {
  type: "tokenEmbeddings";
  requestId: string;
  text: string;
}

interface SimilarityRequest {
  type: "similarity";
  requestId: string;
  textA: string;
  textB: string;
}

export type EmbeddingRequest = TokenEmbeddingRequest | SimilarityRequest;

export interface ProgressMessage {
  type: "progress";
  requestId: string;
  loaded: number;
  total: number;
}

export interface TokenEmbeddingResponse {
  type: "tokenEmbeddings";
  requestId: string;
  tokens: string[];
  /** One row per token, 384 dims each. */
  vectors: number[][];
  error?: string;
}

export interface SimilarityResponse {
  type: "similarity";
  requestId: string;
  /** Cosine similarity, 0..1 (embeddings are L2-normalized). */
  similarity: number;
  error?: string;
}

export type EmbeddingWorkerMessage = ProgressMessage | TokenEmbeddingResponse | SimilarityResponse;

self.onmessage = async (event: MessageEvent<EmbeddingRequest>) => {
  const req = event.data;

  const reportProgress = (loaded: number, total: number) => {
    self.postMessage({ type: "progress", requestId: req.requestId, loaded, total } satisfies ProgressMessage);
  };

  try {
    const extractor = await getExtractor(reportProgress);

    if (req.type === "tokenEmbeddings") {
      if (req.text.trim().length === 0) {
        self.postMessage({ type: "tokenEmbeddings", requestId: req.requestId, tokens: [], vectors: [] } satisfies TokenEmbeddingResponse);
        return;
      }

      const ids = Array.from(extractor.tokenizer.encode(req.text));
      const tokens = idsToSegments(ids, (slice) =>
        extractor.tokenizer.decode(slice, { skip_special_tokens: false }),
      );

      const output = await extractor(req.text, { pooling: "none" });
      const [, seqLen, dims] = output.dims;
      const flat = output.data as Float32Array;
      const vectors: number[][] = [];
      for (let i = 0; i < seqLen; i++) {
        vectors.push(Array.from(flat.slice(i * dims, (i + 1) * dims)));
      }

      self.postMessage({ type: "tokenEmbeddings", requestId: req.requestId, tokens, vectors } satisfies TokenEmbeddingResponse);
    } else {
      if (req.textA.trim().length === 0 || req.textB.trim().length === 0) {
        self.postMessage({ type: "similarity", requestId: req.requestId, similarity: 0 } satisfies SimilarityResponse);
        return;
      }

      const output = await extractor([req.textA, req.textB], { pooling: "mean", normalize: true });
      const dims = output.dims[1];
      const flat = output.data as Float32Array;
      let dot = 0;
      for (let i = 0; i < dims; i++) {
        dot += flat[i] * flat[dims + i];
      }
      // Both vectors are L2-normalized, so the dot product IS the cosine similarity.
      self.postMessage({ type: "similarity", requestId: req.requestId, similarity: dot } satisfies SimilarityResponse);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (req.type === "tokenEmbeddings") {
      self.postMessage({ type: "tokenEmbeddings", requestId: req.requestId, tokens: [], vectors: [], error: message } satisfies TokenEmbeddingResponse);
    } else {
      self.postMessage({ type: "similarity", requestId: req.requestId, similarity: 0, error: message } satisfies SimilarityResponse);
    }
  }
};
