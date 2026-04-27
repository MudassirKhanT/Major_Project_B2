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

const TYPE_MODEL: Record<string, string> = {
  email:    GEMINI_MODELS.FLASH,
  research: GEMINI_MODELS.PRO,
  stock:    GEMINI_MODELS.FLASH,
  code:     GEMINI_MODELS.PRO,
  custom:   GEMINI_MODELS.FLASH,
};

const TYPE_DEFAULTS: Record<string, { temperature: number; maxOutputTokens: number }> = {
  email:    { temperature: 0.7, maxOutputTokens: 4096  },
  research: { temperature: 0.3, maxOutputTokens: 16384 },
  stock:    { temperature: 0.2, maxOutputTokens: 8192  },
  code:     { temperature: 0.1, maxOutputTokens: 32768 },
  custom:   { temperature: 0.7, maxOutputTokens: 4096  },
};

function resolveDefaults(agentType: string | undefined, temperature: number, maxOutputTokens: number) {
  const typeDefaults = TYPE_DEFAULTS[agentType ?? "custom"] ?? TYPE_DEFAULTS.custom;
  return {
    temperature: temperature === 0.7 && typeDefaults.temperature !== 0.7 ? typeDefaults.temperature : temperature,
    maxOutputTokens: maxOutputTokens === 2048 && typeDefaults.maxOutputTokens !== 2048 ? typeDefaults.maxOutputTokens : maxOutputTokens,
  };
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const sendEmailTool = tool({
  description:
    "Send an actual email. Only use this when the user explicitly asks to SEND (not just draft) an email.",
  inputSchema: z.object({
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
  description: "Search the web for current information on a topic.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  execute: async ({ query }) => {
    const key = process.env.SEARCH_API_KEY;
    if (!key) {
      return {
        status: "unavailable",
        message: `Live web search is not configured. Answer the question about "${query}" using your training knowledge. Do not attempt further searches.`,
      };
    }
    return { status: "unavailable", message: "Search API not implemented." };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTools(agentType: string): Record<string, any> | undefined {
  if (agentType === "email") return { send_email: sendEmailTool };
  if (agentType === "research" && process.env.SEARCH_API_KEY) return { search_web: searchWebTool };
  return undefined;
}

// ── Non-streaming ─────────────────────────────────────────────────────────────
export async function runAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const agentType = options.agentType ?? "custom";
  const { messages, systemPrompt } = options;
  const model = options.model ?? TYPE_MODEL[agentType] ?? GEMINI_MODELS.FLASH;
  const resolved = resolveDefaults(agentType, options.temperature ?? 0.7, options.maxTokens ?? 2048);
  const { temperature, maxOutputTokens } = resolved;

  const tools = getTools(agentType);

  const { text, usage } = await generateText({
    model: google(model),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role === "system" ? "user" : (m.role as "user" | "assistant"),
      content: m.content,
    })),
    temperature,
    maxOutputTokens,
    ...(tools ? { tools, maxSteps: 3 } : {}),
  });

  const tokensInput = usage?.inputTokens ?? 0;
  const tokensOutput = usage?.outputTokens ?? 0;
  return { content: text, tokensInput, tokensOutput, totalTokens: tokensInput + tokensOutput, model };
}

// ── Streaming ─────────────────────────────────────────────────────────────────
export async function streamAgentResponse(options: AgentRunOptions) {
  const agentType = options.agentType ?? "custom";
  const { messages, systemPrompt } = options;
  const model = options.model ?? TYPE_MODEL[agentType] ?? GEMINI_MODELS.FLASH;
  const resolved = resolveDefaults(agentType, options.temperature ?? 0.7, options.maxTokens ?? 2048);
  const { temperature, maxOutputTokens } = resolved;

  const tools = getTools(agentType);

  const result = streamText({
    model: google(model),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role === "system" ? "user" : (m.role as "user" | "assistant"),
      content: m.content,
    })),
    temperature,
    maxOutputTokens,
    ...(tools ? { tools, maxSteps: 3 } : {}),
  });

  return result;
}

// ── Agent-as-tool (for orchestration) ────────────────────────────────────────
export function buildAgentTool(agentId: string, agentName: string, agentDesc: string, systemPrompt: string, model: string) {
  return tool({
    description: `Delegate to ${agentName} — ${agentDesc}`,
    inputSchema: z.object({ task: z.string().describe(`Specific task for ${agentName}`) }),
    execute: async ({ task }) => {
      try {
        const { text, usage } = await generateText({
          model: google(model),
          system: systemPrompt,
          messages: [{ role: "user", content: task }],
          temperature: 0.7,
          maxOutputTokens: 1024,
        });
        return { agentName, result: text, tokensUsed: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0) };
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
