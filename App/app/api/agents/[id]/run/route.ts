import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { agentRunLimiter } from "@/lib/arcjet";
import { getAgentById, incrementAgentRuns } from "@/lib/db/queries/agents";
import { createConversation, getConversationById, incrementConversationStats } from "@/lib/db/queries/conversations";
import { createMessage } from "@/lib/db/queries/messages";
import { logUsage } from "@/lib/db/queries/usage";
import { getMemoriesForAgent, formatMemoriesForPrompt, extractAndSaveMemories } from "@/lib/db/queries/memories";
import { streamAgentResponse, runAgent, getDefaultSystemPrompt } from "@/lib/agents/runner";
import { estimateCost, GEMINI_MODELS } from "@/lib/gemini";

// Upgrade old/deprecated model IDs to current equivalents
// Remap blocked/deprecated models to the working free-tier model
const MODEL_UPGRADE: Record<string, string> = {
  "gemini-2.0-flash":          GEMINI_MODELS.FLASH,
  "gemini-2.0-flash-001":      GEMINI_MODELS.FLASH,
  "gemini-2.0-flash-lite":     GEMINI_MODELS.FLASH,
  "gemini-2.0-flash-lite-001": GEMINI_MODELS.FLASH,
  "gemini-1.5-flash":          GEMINI_MODELS.FLASH,
  "gemini-1.5-pro":            GEMINI_MODELS.FLASH,
  "gemini-2.5-pro":            GEMINI_MODELS.FLASH,
};
function upgradeModel(model: string): string {
  return MODEL_UPGRADE[model] ?? model;
}

interface RouteParams { params: { id: string } }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (agentRunLimiter) {
    const decision = await agentRunLimiter.protect(req, { requested: 1, userId });
    if (decision.isDenied())
      return NextResponse.json({ error: "Rate limit exceeded. Max 10 runs/min." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { messages, conversationId, stream = true } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const agent = await getAgentById(params.id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (agent.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const model = upgradeModel(agent.model ?? GEMINI_MODELS.FLASH);
    const basePrompt = getDefaultSystemPrompt(agent.type, agent.systemPrompt);

    // ── Inject persistent memories ────────────────────────────────────────────
    const agentMemories = await getMemoriesForAgent(userId, params.id, 15);
    const memoryContext = formatMemoriesForPrompt(agentMemories);
    const systemPrompt = basePrompt + memoryContext;

    // ── Conversation ──────────────────────────────────────────────────────────
    let convId: string = "";
    if (conversationId) {
      const existing = await getConversationById(conversationId);
      if (existing && existing.userId === userId && existing.agentId === params.id) {
        convId = existing.id;
      }
    }
    if (!convId) {
      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      const title = typeof lastUserMsg?.content === "string"
        ? lastUserMsg.content.slice(0, 60)
        : "New conversation";
      const conv = await createConversation({ userId, agentId: params.id, title, status: "active" });
      convId = conv.id;
    }

    const runOptions = {
      agentId: params.id,
      agentType: agent.type,
      userId,
      conversationId: convId,
      messages,
      systemPrompt,
      model,
      temperature: agent.temperature ?? 0.7,
      maxTokens: agent.maxTokens ?? 2048,
    };

    // ── Streaming ─────────────────────────────────────────────────────────────
    if (stream) {
      const result = await streamAgentResponse(runOptions);
      const encoder = new TextEncoder();
      let fullText = "";

      const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      if (lastUserMsg) {
        await createMessage({ conversationId: convId, agentId: params.id, userId, role: "user", content: lastUserMsg.content });
      }

      const readable = new ReadableStream({
        async start(controller) {
          const send = (data: object) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          try {
            for await (const part of result.fullStream) {
              if (req.signal.aborted) break;
              if (part.type === "text-delta") {
                fullText += part.text;
                send({ text: part.text });
              } else if (part.type === "error") {
                const e = (part as { type: "error"; error: unknown }).error;
                throw new Error(e instanceof Error ? e.message : String(e));
              }
            }

            if (req.signal.aborted) {
              controller.close();
              return;
            }

            if (!fullText.trim()) {
              send({ error: "The model returned an empty response. Try rephrasing your message." });
              controller.close();
              return;
            }

            const usageData = await result.usage;
            const tokensInput = usageData?.inputTokens ?? 0;
            const tokensOutput = usageData?.outputTokens ?? 0;
            const totalTokens = tokensInput + tokensOutput;
            const cost = estimateCost(model, tokensInput, tokensOutput);

            await Promise.all([
              createMessage({ conversationId: convId, agentId: params.id, userId, role: "assistant", content: fullText, tokensUsed: totalTokens }),
              incrementConversationStats(convId, totalTokens, 2),
              incrementAgentRuns(params.id, totalTokens),
              logUsage({ userId, agentId: params.id, conversationId: convId, tokensInput, tokensOutput, model, costEstimate: cost }),
            ]);

            // Only extract memories every 5 conversations to conserve API quota
            if (Math.random() < 0.2) {
              const convoText = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n") + `\nassistant: ${fullText}`;
              extractAndSaveMemories(userId, params.id, convoText).catch(() => {});
            }

            send({ done: true, conversationId: convId, tokensUsed: totalTokens });
            controller.close();
          } catch (err) {
            if (req.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
              controller.close();
            } else {
              const msg = err instanceof Error ? err.message : "Stream error";
              console.error("Stream error:", err);
              try { send({ error: msg }); } catch { /* stream already closed */ }
              controller.close();
            }
          }
        },
        cancel() {},
      });

      return new NextResponse(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    // ── Non-streaming ─────────────────────────────────────────────────────────
    const res = await runAgent(runOptions);
    const cost = estimateCost(model, res.tokensInput, res.tokensOutput);

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    if (lastUserMsg) {
      await createMessage({ conversationId: convId, agentId: params.id, userId, role: "user", content: lastUserMsg.content });
    }

    await Promise.all([
      createMessage({ conversationId: convId, agentId: params.id, userId, role: "assistant", content: res.content, tokensUsed: res.totalTokens }),
      incrementConversationStats(convId, res.totalTokens, 2),
      incrementAgentRuns(params.id, res.totalTokens),
      logUsage({ userId, agentId: params.id, conversationId: convId, tokensInput: res.tokensInput, tokensOutput: res.tokensOutput, model, costEstimate: cost }),
    ]);

    // Only extract memories every 5 conversations to conserve API quota
    if (Math.random() < 0.2) {
      const convoText = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n") + `\nassistant: ${res.content}`;
      extractAndSaveMemories(userId, params.id, convoText).catch(() => {});
    }

    return NextResponse.json({ content: res.content, conversationId: convId, tokensUsed: res.totalTokens, model });
  } catch (error) {
    console.error("POST /api/agents/[id]/run:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("exceeded your current quota")) {
      return NextResponse.json(
        { error: "API quota exceeded. Please check your Google AI billing plan at aistudio.google.com." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Failed to run agent" }, { status: 500 });
  }
}
