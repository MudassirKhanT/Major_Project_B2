import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const GEMINI_MODELS = {
  FLASH: "gemini-2.0-flash",
  FLASH_LITE: "gemini-2.0-flash-lite",
  PRO: "gemini-1.5-pro",
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

// Cost estimate in USD per 1M tokens (approximate)
const TOKEN_COST: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 3.5, output: 10.5 },
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
