import { db } from "@/lib/db";
import { memories, NewMemory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function saveMemory(data: NewMemory) {
  const [mem] = await db.insert(memories).values(data).returning();
  return mem;
}

export async function getMemoriesForAgent(userId: string, agentId: string, limit = 20) {
  return db
    .select()
    .from(memories)
    .where(and(eq(memories.userId, userId), eq(memories.agentId, agentId)))
    .orderBy(desc(memories.importance), desc(memories.createdAt))
    .limit(limit);
}

export async function deleteMemory(id: string) {
  await db.delete(memories).where(eq(memories.id, id));
}

export async function clearAgentMemories(userId: string, agentId: string) {
  await db.delete(memories).where(
    and(eq(memories.userId, userId), eq(memories.agentId, agentId))
  );
}

// Auto-extract and save memories from a completed conversation
export async function extractAndSaveMemories(
  userId: string,
  agentId: string,
  conversationText: string
) {
  const { generateText } = await import("ai");
  const { google, GEMINI_MODELS } = await import("@/lib/gemini");

  try {
    const { text } = await generateText({
      model: google(GEMINI_MODELS.FLASH_LITE),
      system: `Extract 1-3 important facts worth remembering from this conversation.
Return JSON array: [{"content": "fact here", "importance": 7}]
Importance 1-10 (10 = most important). Only facts, preferences, or context useful for future conversations.
If nothing worth remembering, return [].`,
      messages: [{ role: "user", content: `Conversation:\n${conversationText.slice(0, 3000)}` }],
      maxTokens: 300,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const facts: Array<{ content: string; importance: number }> = JSON.parse(jsonMatch[0]);
    await Promise.all(
      facts.map((f) =>
        saveMemory({ userId, agentId, content: f.content, importance: Math.min(10, Math.max(1, f.importance)) })
      )
    );
  } catch {
    // Silently fail — memory extraction is best-effort
  }
}

// Format memories for injection into system prompt
export function formatMemoriesForPrompt(mems: Array<{ content: string }>): string {
  if (!mems.length) return "";
  const list = mems.map((m) => `- ${m.content}`).join("\n");
  return `\n\n## What I Remember About You\n${list}\n`;
}
