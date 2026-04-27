import { db } from "@/lib/db";
import { messages, NewMessage } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function createMessage(data: NewMessage) {
  const [msg] = await db.insert(messages).values(data).returning();
  return msg;
}

export async function listMessagesByConversation(conversationId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}
