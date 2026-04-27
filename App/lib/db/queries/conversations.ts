import { db } from "@/lib/db";
import { conversations, NewConversation } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function createConversation(data: NewConversation) {
  const [conv] = await db.insert(conversations).values(data).returning();
  return conv;
}

export async function getConversationById(id: string) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));
  return conv ?? null;
}

export async function listConversationsByUser(userId: string) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function listConversationsByAgent(agentId: string) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.agentId, agentId))
    .orderBy(desc(conversations.updatedAt));
}

export async function incrementConversationStats(id: string, tokens: number, messageCount = 1) {
  await db
    .update(conversations)
    .set({
      totalMessages: sql`COALESCE(${conversations.totalMessages}, 0) + ${messageCount}`,
      totalTokens: sql`COALESCE(${conversations.totalTokens}, 0) + ${tokens}`,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}

export async function updateConversationStatus(
  id: string,
  status: "active" | "completed" | "failed"
) {
  await db
    .update(conversations)
    .set({ status, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function deleteConversation(id: string) {
  await db.delete(conversations).where(eq(conversations.id, id));
}
