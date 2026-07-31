"use client";

import { useCallback, useEffect, useRef } from "react";
import type { WorkerRequest, WorkerResponse } from "@/lib/tokenizer.worker";

/**
 * Runs one shared Web Worker for the whole page. All tokenization (tiktoken
 * and the Hugging Face tokenizers) happens there, so no matter how heavy a
 * model's vocabulary is, typing in the textarea never blocks the UI thread.
 */
export function useTokenizerWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<string, (res: WorkerResponse) => void>());

  useEffect(() => {
    const pending = pendingRef.current;
    const worker = new Worker(
      new URL("./tokenizer.worker.ts", import.meta.url),
    );
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const resolve = pending.get(event.data.requestId);
      if (resolve) {
        resolve(event.data);
        pending.delete(event.data.requestId);
      }
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      pending.clear();
    };
  }, []);

  const request = useCallback(
    (modelId: string, text: string): Promise<WorkerResponse> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve({ requestId: "", modelId, tokens: 0, segments: [], error: "worker not ready" });
          return;
        }
        const requestId = crypto.randomUUID();
        pendingRef.current.set(requestId, resolve);
        const message: WorkerRequest = { requestId, modelId, text };
        worker.postMessage(message);
      });
    },
    [],
  );

  return request;
}
