"use client";

import { useCallback, useEffect, useRef } from "react";
import type { WorkerRequest, WorkerResponse } from "@/lib/tokenizer.worker";
import { createRequestId } from "@/lib/request-id";

const REQUEST_TIMEOUT_MS = 45_000;

interface PendingRequest {
  resolve: (response: WorkerResponse) => void;
  timeout: number;
  modelId: string;
}

export function useTokenizerWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<string, PendingRequest>());
  const workerErrorRef = useRef<string | null>(null);

  useEffect(() => {
    const pending = pendingRef.current;
    const worker = new Worker(new URL("./tokenizer.worker.ts", import.meta.url));

    const resolveAllWithError = (message: string) => {
      workerErrorRef.current = message;
      for (const [requestId, entry] of pending) {
        window.clearTimeout(entry.timeout);
        entry.resolve({
          requestId,
          modelId: entry.modelId,
          tokens: 0,
          segments: [],
          error: message,
        });
      }
      pending.clear();
    };

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const entry = pending.get(event.data.requestId);
      if (!entry) return;
      window.clearTimeout(entry.timeout);
      entry.resolve(event.data);
      pending.delete(event.data.requestId);
    };

    worker.onerror = (event) => {
      resolveAllWithError(event.message || "Tokenizer worker failed");
    };

    worker.onmessageerror = () => {
      resolveAllWithError("Tokenizer worker returned an unreadable response");
    };

    workerRef.current = worker;

    return () => {
      for (const [requestId, entry] of pending) {
        window.clearTimeout(entry.timeout);
        entry.resolve({
          requestId,
          modelId: entry.modelId,
          tokens: 0,
          segments: [],
          error: "Tokenizer worker stopped",
        });
      }
      pending.clear();
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return useCallback(
    (modelId: string, text: string): Promise<WorkerResponse> =>
      new Promise((resolve) => {
        const worker = workerRef.current;
        const workerError = workerErrorRef.current;
        if (!worker || workerError) {
          resolve({
            requestId: "",
            modelId,
            tokens: 0,
            segments: [],
            error: workerError ?? "Tokenizer worker is not ready",
          });
          return;
        }

        const requestId = createRequestId();
        const timeout = window.setTimeout(() => {
          pendingRef.current.delete(requestId);
          resolve({
            requestId,
            modelId,
            tokens: 0,
            segments: [],
            error: "Tokenizer request timed out",
          });
        }, REQUEST_TIMEOUT_MS);

        pendingRef.current.set(requestId, { resolve, timeout, modelId });
        const message: WorkerRequest = { requestId, modelId, text };
        worker.postMessage(message);
      }),
    [],
  );
}
