import { db } from "@/lib/db";
import { usageLogs } from "@/lib/db/schema";
import { eq, desc, sum } from "drizzle-orm";

export async function logUsage(data: {
  userId: string;
  agentId: string;
  conversationId: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
  costEstimate?: number;
}) {
  await db.insert(usageLogs).values({
    ...data,
    totalTokens: data.tokensInput + data.tokensOutput,
    costEstimate: data.costEstimate ?? 0,
  });
}

export async function getUserStats(userId: string) {
  const logs = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId))
    .orderBy(desc(usageLogs.createdAt));

  const totalTokens = logs.reduce((s, l) => s + l.totalTokens, 0);
  const totalCost = logs.reduce((s, l) => s + (l.costEstimate ?? 0), 0);

  return {
    totalRuns: logs.length,
    totalTokens,
    totalCost,
    logs: logs.slice(0, 20),
  };
}

export async function getAgentStats(agentId: string) {
  const logs = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.agentId, agentId));

  const totalTokens = logs.reduce((s, l) => s + l.totalTokens, 0);
  return {
    totalRuns: logs.length,
    totalTokens,
    avgTokensPerRun:
      logs.length > 0 ? Math.round(totalTokens / logs.length) : 0,
  };
}
