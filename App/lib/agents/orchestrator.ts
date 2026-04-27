import { generateText } from "ai";
import { google, GEMINI_MODELS } from "@/lib/gemini";
import { buildAgentTool, getDefaultSystemPrompt } from "./runner";
import { getAgentById } from "@/lib/db/queries/agents";
import { OrchestrationTask, OrchestrationResult } from "./types";

export async function runOrchestration(task: OrchestrationTask): Promise<OrchestrationResult> {
  const { task: userTask, agentIds, userId, mode } = task;

  // Load all agents
  const agents = await Promise.all(agentIds.map((id) => getAgentById(id)));
  const validAgents = agents.filter(Boolean) as NonNullable<(typeof agents)[0]>[];

  if (!validAgents.length) throw new Error("No valid agents found");

  // ── Parallel mode: run all agents simultaneously, then synthesize ──────────
  if (mode === "parallel") {
    const results = await Promise.all(
      validAgents.map(async (agent) => {
        try {
          const systemPrompt = getDefaultSystemPrompt(agent.type, agent.systemPrompt);
          const { text, usage } = await generateText({
            model: google(agent.model ?? GEMINI_MODELS.FLASH),
            system: systemPrompt,
            messages: [{ role: "user", content: userTask }],
            temperature: agent.temperature ?? 0.7,
            maxTokens: 1024,
          });
          return {
            agentId: agent.id,
            agentName: agent.name,
            result: text,
            tokensUsed: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
          };
        } catch (err) {
          return {
            agentId: agent.id,
            agentName: agent.name,
            result: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
            tokensUsed: 0,
          };
        }
      })
    );

    // Synthesize all results
    const synthesis = results
      .map((r) => `### ${r.agentName}\n${r.result}`)
      .join("\n\n---\n\n");

    const { text: finalAnswer, usage: synthUsage } = await generateText({
      model: google(GEMINI_MODELS.FLASH),
      system: "You are a synthesis expert. Combine multiple agent responses into one clear, comprehensive answer. Eliminate redundancy. Be concise.",
      messages: [
        {
          role: "user",
          content: `Original task: ${userTask}\n\nAgent responses:\n${synthesis}\n\nProvide a final synthesized answer.`,
        },
      ],
      maxTokens: 1500,
    });

    return {
      finalAnswer,
      agentResults: results,
      totalTokens: results.reduce((s, r) => s + r.tokensUsed, 0) + ((synthUsage?.promptTokens ?? 0) + (synthUsage?.completionTokens ?? 0)),
    };
  }

  // ── Sequential / Auto mode: orchestrator delegates via tool calls ──────────
  const agentTools: Record<string, ReturnType<typeof buildAgentTool>> = {};
  for (const agent of validAgents) {
    const systemPrompt = getDefaultSystemPrompt(agent.type, agent.systemPrompt);
    const safeKey = agent.name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40);
    agentTools[safeKey] = buildAgentTool(
      agent.id,
      agent.name,
      agent.description,
      systemPrompt,
      agent.model ?? GEMINI_MODELS.FLASH
    );
  }

  const agentList = validAgents
    .map((a) => `- ${a.name} (${a.type}): ${a.description}`)
    .join("\n");

  const { text: finalAnswer, usage } = await generateText({
    model: google(GEMINI_MODELS.FLASH),
    system: `You are an AI orchestrator. You have access to specialized agents.
Delegate sub-tasks to the right agents and synthesize their results into a final answer.

Available agents:
${agentList}

Strategy:
1. Analyze the task and decide which agents to use
2. Call each agent with a specific, focused sub-task
3. Combine their responses into a comprehensive final answer`,
    messages: [{ role: "user", content: userTask }],
    tools: agentTools,
    maxSteps: validAgents.length + 2,
    maxTokens: 2000,
  });

  const totalTokens = (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);

  return {
    finalAnswer,
    agentResults: validAgents.map((a) => ({
      agentId: a.id,
      agentName: a.name,
      result: "(called via orchestrator tool)",
      tokensUsed: 0,
    })),
    totalTokens,
  };
}
