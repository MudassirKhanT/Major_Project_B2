import { db } from "@/lib/db";
import { agents, NewAgent } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function createAgent(data: NewAgent) {
  const [agent] = await db.insert(agents).values(data).returning();
  return agent;
}

export async function getAgentById(id: string) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, id));
  return agent ?? null;
}

export async function listAgentsByUser(userId: string) {
  return db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId))
    .orderBy(desc(agents.createdAt));
}

export async function listAgentsByUserAndType(
  userId: string,
  type: "email" | "research" | "stock" | "code" | "custom"
) {
  return db
    .select()
    .from(agents)
    .where(and(eq(agents.userId, userId), eq(agents.type, type)))
    .orderBy(desc(agents.createdAt));
}

export async function updateAgent(
  id: string,
  data: Partial<Omit<NewAgent, "id" | "userId" | "createdAt">>
) {
  const [updated] = await db
    .update(agents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(agents.id, id))
    .returning();
  return updated;
}

export async function deleteAgent(id: string) {
  await db.delete(agents).where(eq(agents.id, id));
}

export async function incrementAgentRuns(id: string, tokensUsed: number) {
  const agent = await getAgentById(id);
  if (!agent) throw new Error("Agent not found");
  await db
    .update(agents)
    .set({
      totalRuns: (agent.totalRuns ?? 0) + 1,
      totalTokensUsed: (agent.totalTokensUsed ?? 0) + tokensUsed,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, id));
}
