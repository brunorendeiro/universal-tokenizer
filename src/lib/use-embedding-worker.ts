"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  EmbeddingRequest,
  EmbeddingWorkerMessage,
  SimilarityResponse,
  TokenEmbeddingResponse,
} from "@/lib/embedding.worker";

type Result = TokenEmbeddingResponse | SimilarityResponse;

/**
 * Same shared-worker pattern as useTokenizerWorker, but this worker also
 * streams "progress" events (model download %) before the final result —
 * those are routed to a separate per-request progress callback instead of
 * resolving the promise.
 */
export function useEmbeddingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<string, (res: Result) => void>());
  const progressRef = useRef(new Map<string, (loaded: number, total: number) => void>());

  useEffect(() => {
    const pending = pendingRef.current;
    const progress = progressRef.current;
    const worker = new Worker(new URL("./embedding.worker.ts", import.meta.url));

    worker.onmessage = (event: MessageEvent<EmbeddingWorkerMessage>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        progress.get(msg.requestId)?.(msg.loaded, msg.total);
        return;
      }
      const resolve = pending.get(msg.requestId);
      if (resolve) {
        resolve(msg);
        pending.delete(msg.requestId);
        progress.delete(msg.requestId);
      }
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      pending.clear();
      progress.clear();
    };
  }, []);

  const request = useCallback(
    (req: EmbeddingRequest, onProgress?: (loaded: number, total: number) => void): Promise<Result> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve(
            req.type === "tokenEmbeddings"
              ? { type: "tokenEmbeddings", requestId: req.requestId, tokens: [], vectors: [], error: "worker not ready" }
              : { type: "similarity", requestId: req.requestId, similarity: 0, error: "worker not ready" },
          );
          return;
        }
        pendingRef.current.set(req.requestId, resolve);
        if (onProgress) progressRef.current.set(req.requestId, onProgress);
        worker.postMessage(req);
      });
    },
    [],
  );

  return request;
}
