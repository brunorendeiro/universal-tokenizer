import type { NoteKey } from "@/lib/i18n";

export type Accuracy = "exact" | "approx";

export type TokenizerEngine =
  | { kind: "tiktoken"; encoding: "o200k_base" | "cl100k_base" | "gpt2" }
  | { kind: "hf"; repo: string }
  // Several providers don't publish their tokenizer, so we approximate using
  // the GPT o200k_base encoding as a stand-in. Counts are in the right
  // ballpark but will not match the provider's official count_tokens API.
  | { kind: "approx-tiktoken"; encoding: "o200k_base" };

export interface ModelDef {
  id: string;
  label: string;
  provider: string;
  accuracy: Accuracy;
  engine: TokenizerEngine;
  /** $ per 1M tokens. Omit when pricing is not publicly listed / not applicable. */
  pricing?: { input: number; output: number };
  contextWindow?: number;
  noteKey?: NoteKey;
}

export const MODELS: ModelDef[] = [
  // ---- OpenAI — exact, tokenizer is public (tiktoken) ----
  {
    id: "gpt-o200k",
    label: "GPT-4o / GPT-4.1 / o1 / o3 (o200k_base)",
    provider: "OpenAI",
    accuracy: "exact",
    engine: { kind: "tiktoken", encoding: "o200k_base" },
    pricing: { input: 2.5, output: 10 },
    contextWindow: 128_000,
  },
  {
    id: "gpt-cl100k",
    label: "GPT-4 / GPT-3.5-turbo (cl100k_base)",
    provider: "OpenAI",
    accuracy: "exact",
    engine: { kind: "tiktoken", encoding: "cl100k_base" },
    pricing: { input: 10, output: 30 },
    contextWindow: 128_000,
  },
  {
    id: "gpt2",
    label: "GPT-2",
    provider: "OpenAI",
    accuracy: "exact",
    engine: { kind: "tiktoken", encoding: "gpt2" },
    contextWindow: 1_024,
    noteKey: "historical",
  },

  // ---- Anthropic — approximated (no public tokenizer) ----
  {
    id: "claude-opus",
    label: "Claude Opus",
    provider: "Anthropic",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 5, output: 25 },
    contextWindow: 1_000_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet",
    provider: "Anthropic",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 3, output: 15 },
    contextWindow: 1_000_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku",
    provider: "Anthropic",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 1, output: 5 },
    contextWindow: 200_000,
    noteKey: "approxNoPublicTokenizer",
  },

  // ---- Google — Gemini is approximated (closed); Gemma is exact (open) ----
  {
    id: "gemini-pro",
    label: "Gemini 2.x Pro",
    provider: "Google",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 1.25, output: 5 },
    contextWindow: 1_000_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "gemini-flash",
    label: "Gemini 2.x Flash",
    provider: "Google",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 0.075, output: 0.3 },
    contextWindow: 1_000_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "gemma2",
    label: "Gemma 2",
    provider: "Google",
    accuracy: "exact",
    engine: { kind: "hf", repo: "Xenova/gemma2-tokenizer" },
    contextWindow: 8_192,
    noteKey: "openWeightsGoogle",
  },

  // ---- Other closed providers — approximated (no public tokenizer) ----
  {
    id: "grok",
    label: "Grok",
    provider: "xAI",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 3, output: 15 },
    contextWindow: 128_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "command-r-plus",
    label: "Command R+",
    provider: "Cohere",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 2.5, output: 10 },
    contextWindow: 128_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "nova-pro",
    label: "Amazon Nova Pro",
    provider: "Amazon",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 0.8, output: 3.2 },
    contextWindow: 300_000,
    noteKey: "approxNoPublicTokenizer",
  },
  {
    id: "sonar",
    label: "Sonar",
    provider: "Perplexity",
    accuracy: "approx",
    engine: { kind: "approx-tiktoken", encoding: "o200k_base" },
    pricing: { input: 1, output: 1 },
    contextWindow: 128_000,
    noteKey: "approxNoPublicTokenizer",
  },

  // ---- Open-weight models — exact, tokenizer files are public ----
  {
    id: "llama3",
    label: "Llama 3 / 3.1 / 3.2",
    provider: "Meta",
    accuracy: "exact",
    engine: { kind: "hf", repo: "Xenova/llama3-tokenizer" },
    contextWindow: 128_000,
    noteKey: "openWeights",
  },
  {
    id: "mistral",
    label: "Mistral 7B / Mixtral",
    provider: "Mistral AI",
    accuracy: "exact",
    engine: { kind: "hf", repo: "Xenova/mistral-tokenizer-v3" },
    contextWindow: 32_000,
    noteKey: "openWeights",
  },
  {
    id: "qwen",
    label: "Qwen 2.5",
    provider: "Alibaba",
    accuracy: "exact",
    engine: { kind: "hf", repo: "Qwen/Qwen2.5-7B-Instruct" },
    contextWindow: 128_000,
    noteKey: "openWeights",
  },
  {
    id: "phi3",
    label: "Phi-3 Mini",
    provider: "Microsoft",
    accuracy: "exact",
    engine: { kind: "hf", repo: "microsoft/Phi-3-mini-4k-instruct" },
    contextWindow: 4_096,
    noteKey: "openWeights",
  },
  {
    id: "deepseek",
    label: "DeepSeek LLM 7B",
    provider: "DeepSeek",
    accuracy: "exact",
    engine: { kind: "hf", repo: "deepseek-ai/deepseek-llm-7b-base" },
    contextWindow: 4_096,
    noteKey: "openWeights",
  },
  {
    id: "olmo2",
    label: "OLMo 2 7B",
    provider: "Allen Institute for AI",
    accuracy: "exact",
    engine: { kind: "hf", repo: "allenai/OLMo-2-1124-7B" },
    contextWindow: 4_096,
    noteKey: "openWeightsFull",
  },
  {
    id: "falcon",
    label: "Falcon 7B",
    provider: "TII",
    accuracy: "exact",
    engine: { kind: "hf", repo: "tiiuae/falcon-7b" },
    contextWindow: 2_048,
    noteKey: "openWeights",
  },
  {
    id: "starcoder2",
    label: "StarCoder2 15B",
    provider: "BigCode",
    accuracy: "exact",
    engine: { kind: "hf", repo: "bigcode/starcoder2-15b" },
    contextWindow: 16_384,
    noteKey: "openWeights",
  },
  {
    id: "yi",
    label: "Yi 1.5 9B",
    provider: "01.AI",
    accuracy: "exact",
    engine: { kind: "hf", repo: "01-ai/Yi-1.5-9B" },
    contextWindow: 4_096,
    noteKey: "openWeights",
  },
];

export const PROVIDERS = Array.from(new Set(MODELS.map((m) => m.provider)));
