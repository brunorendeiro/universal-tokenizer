"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  EmbeddingRequest,
  EmbeddingWorkerMessage,
  SimilarityResponse,
  TokenEmbeddingResponse,
} from "@/lib/embedding.worker";

type Result = TokenEmbeddingResponse | SimilarityResponse;

const REQUEST_TIMEOUT_MS = 120_000;

interface PendingRequest {
  request: EmbeddingRequest;
  resolve: (result: Result) => void;
  timeout: number;
}

function errorResult(request: EmbeddingRequest, error: string): Result {
  return request.type === "tokenEmbeddings"
    ? {
        type: "tokenEmbeddings",
        requestId: request.requestId,
        tokens: [],
        vectors: [],
        error,
      }
    : {
        type: "similarity",
        requestId: request.requestId,
        similarity: 0,
        error,
      };
}

export function useEmbeddingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<string, PendingRequest>());
  const progressRef = useRef(
    new Map<string, (loaded: number, total: number) => void>(),
  );

  useEffect(() => {
    const pending = pendingRef.current;
    const progress = progressRef.current;
    const worker = new Worker(new URL("./embedding.worker.ts", import.meta.url));

    const resolveAllWithError = (message: string) => {
      for (const [requestId, entry] of pending) {
        window.clearTimeout(entry.timeout);
        entry.resolve(errorResult(entry.request, message));
        progress.delete(requestId);
      }
      pending.clear();
    };

    worker.onmessage = (event: MessageEvent<EmbeddingWorkerMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        progress.get(message.requestId)?.(message.loaded, message.total);
        return;
      }

      const entry = pending.get(message.requestId);
      if (!entry) return;
      window.clearTimeout(entry.timeout);
      entry.resolve(message);
      pending.delete(message.requestId);
      progress.delete(message.requestId);
    };

    worker.onerror = (event) => {
      resolveAllWithError(event.message || "Embedding worker failed");
    };
    worker.onmessageerror = () => {
      resolveAllWithError("Embedding worker returned an unreadable response");
    };
    workerRef.current = worker;

    return () => {
      resolveAllWithError("Embedding worker stopped");
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return useCallback(
    (
      request: EmbeddingRequest,
      onProgress?: (loaded: number, total: number) => void,
    ): Promise<Result> =>
      new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve(errorResult(request, "Embedding worker is not ready"));
          return;
        }

        const timeout = window.setTimeout(() => {
          pendingRef.current.delete(request.requestId);
          progressRef.current.delete(request.requestId);
          resolve(errorResult(request, "Embedding request timed out"));
        }, REQUEST_TIMEOUT_MS);

        pendingRef.current.set(request.requestId, {
          request,
          resolve,
          timeout,
        });
        if (onProgress) progressRef.current.set(request.requestId, onProgress);
        worker.postMessage(request);
      }),
    [],
  );
}
