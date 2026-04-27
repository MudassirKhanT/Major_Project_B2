import { streamText, generateText, tool } from "ai";
import { z } from "zod";
import { google, GEMINI_MODELS } from "@/lib/gemini";
import { AgentRunOptions, AgentRunResult } from "./types";
import { EMAIL_AGENT_SYSTEM_PROMPT } from "./email-agent";
import { RESEARCH_AGENT_SYSTEM_PROMPT } from "./research-agent";
import { STOCK_AGENT_SYSTEM_PROMPT } from "./stock-agent";
import { CODE_AGENT_SYSTEM_PROMPT } from "./code-agent";

const AGENT_TYPE_PROMPTS: Record<string, string> = {
  email: EMAIL_AGENT_SYSTEM_PROMPT,
  research: RESEARCH_AGENT_SYSTEM_PROMPT,
  stock: STOCK_AGENT_SYSTEM_PROMPT,
  code: CODE_AGENT_SYSTEM_PROMPT,
};

const TYPE_DEFAULTS: Record<string, { temperature: number; maxTokens: number }> = {
  email:    { temperature: 0.7, maxTokens: 2048 },
  research: { temperature: 0.3, maxTokens: 4096 },
  stock:    { temperature: 0.2, maxTokens: 3000 },
  code:     { temperature: 0.1, maxTokens: 8192 },
  custom:   { temperature: 0.7, maxTokens: 2048 },
};

function resolveDefaults(agentType: string | undefined, temperature: number, maxTokens: number) {
  const typeDefaults = TYPE_DEFAULTS[agentType ?? "custom"] ?? TYPE_DEFAULTS.custom;
  return {
    temperature: temperature === 0.7 && typeDefaults.temperature !== 0.7 ? typeDefaults.temperature : temperature,
    maxTokens: maxTokens === 2048 && typeDefaults.maxTokens !== 2048 ? typeDefaults.maxTokens : maxTokens,
  };
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const sendEmailTool = tool({
  description:
    "Send an actual email. Only use this when the user explicitly asks to SEND (not just draft) an email.",
  parameters: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Full plain-text email body"),
  }),
  execute: async ({ to, subject, body }) => {
    const key = process.env.RESEND_API_KEY;
    if (!key) return { success: false, error: "RESEND_API_KEY not configured" };
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(key);
      const { data, error } = await resend.emails.send({
        from: "Agentify <onboarding@resend.dev>",
        to: [to],
        subject,
        text: body,
        html: body.replace(/\n/g, "<br/>"),
      });
      if (error) return { success: false, error: error.message };
      return { success: true, id: data?.id, message: `✅ Email sent to ${to}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },
});

const searchWebTool = tool({
  description: "Search for current information on a topic to help answer research questions.",
  parameters: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }) => {
    // Stub — swap in Brave/Serper/Tavily API key here for live search
    return {
      results: `Showing placeholder results for: "${query}". Add SEARCH_API_KEY to enable live web search.`,
    };
  },
});

// Build tools map based on agent type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTools(agentType: string): Record<string, any> | undefined {
  if (agentType === "email") return { send_email: sendEmailTool };
  if (agentType === "research") return { search_web: searchWebTool };
  return undefined;
}

// ── Non-streaming ─────────────────────────────────────────────────────────────
export async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const { messages, systemPrompt, model = GEMINI_MODELS.FLASH } = options;
  const resolved = resolveDefaults(options.agentType, options.temperature ?? 0.7, options.maxTokens ?? 2048);
  const { temperature, maxTokens } = resolved;

  const tools = getTools(options.agentType ?? "custom");

  const { text, usage } = await generateText({
    model: google(model),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role === "system" ? "user" : (m.role as "user" | "assistant"),
      content: m.content,
    })),
    temperature,
    maxTokens,
    ...(tools ? { tools, maxSteps: 5 } : {}),
  });

  const tokensInput = usage?.promptTokens ?? 0;
  const tokensOutput = usage?.completionTokens ?? 0;
  return { content: text, tokensInput, tokensOutput, totalTokens: tokensInput + tokensOutput, model };
}

// ── Streaming ─────────────────────────────────────────────────────────────────
export async function streamAgentResponse(options: AgentRunOptions) {
  const { messages, systemPrompt, model = GEMINI_MODELS.FLASH } = options;
  const resolved = resolveDefaults(options.agentType, options.temperature ?? 0.7, options.maxTokens ?? 2048);
  const { temperature, maxTokens } = resolved;

  const tools = getTools(options.agentType ?? "custom");

  const result = streamText({
    model: google(model),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role === "system" ? "user" : (m.role as "user" | "assistant"),
      content: m.content,
    })),
    temperature,
    maxTokens,
    ...(tools ? { tools, maxSteps: 5 } : {}),
  });

  return result;
}

// ── Agent-as-tool (for orchestration) ────────────────────────────────────────
export function buildAgentTool(agentId: string, agentName: string, agentDesc: string, systemPrompt: string, model: string) {
  return tool({
    description: `Delegate to ${agentName} — ${agentDesc}`,
    parameters: z.object({ task: z.string().describe(`Specific task for ${agentName}`) }),
    execute: async ({ task }) => {
      try {
        const { text, usage } = await generateText({
          model: google(model),
          system: systemPrompt,
          messages: [{ role: "user", content: task }],
          temperature: 0.7,
          maxTokens: 1024,
        });
        return { agentName, result: text, tokensUsed: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0) };
      } catch (err) {
        return { agentName, result: "", error: err instanceof Error ? err.message : "Agent error" };
      }
    },
  });
}

export function getDefaultSystemPrompt(agentType: string, customPrompt?: string | null): string {
  if (customPrompt?.trim()) return customPrompt;
  return AGENT_TYPE_PROMPTS[agentType] ?? "You are a helpful AI assistant.";
}
