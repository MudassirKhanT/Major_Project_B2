import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const GEMINI_MODELS = {
  // Free tier: 10 RPM, 20 RPD for 2.5-flash — the only working free model on this key
  FLASH:      "gemini-2.5-flash",
  FLASH_LITE: "gemini-2.5-flash",   // same model — no separate lite on this key
  PRO:        "gemini-2.5-flash",   // same model — 2.5-pro has ~5 RPD free
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

// Cost estimate in USD per 1M tokens (free tier = $0 within daily limits)
const TOKEN_COST: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash":      { input: 0.10,  output: 0.40 },
  "gemini-2.0-flash-001":  { input: 0.10,  output: 0.40 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.30 },
  // 2.5 models kept for reference but 20 req/day free limit — avoid by default
  "gemini-2.5-flash":      { input: 0.15,  output: 0.60 },
  "gemini-2.5-pro":        { input: 1.25,  output: 10.0 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const cost = TOKEN_COST[model] ?? TOKEN_COST["gemini-2.0-flash"];
  return (
    (inputTokens / 1_000_000) * cost.input +
    (outputTokens / 1_000_000) * cost.output
  );
}
