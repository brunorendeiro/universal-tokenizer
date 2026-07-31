export function estimateCost(
  tokens: number,
  pricing: { input: number; output: number } | undefined,
): number | null {
  if (!pricing) return null;
  return (tokens / 1_000_000) * pricing.input;
}
