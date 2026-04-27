import {
  pgTable,
  text,
  integer,
  bigint,
  real,
  pgEnum,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const agentTypeEnum = pgEnum("agent_type", [
  "email",
  "research",
  "stock",
  "code",
  "custom",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "inactive",
  "draft",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "completed",
  "failed",
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

// ─── Agents ───────────────────────────────────────────────────────────────────
export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: agentTypeEnum("type").notNull().default("custom"),
  status: agentStatusEnum("status").notNull().default("draft"),
  systemPrompt: text("system_prompt").notNull(),
  model: text("model").default("gemini-2.0-flash"),
  temperature: real("temperature").default(0.7),
  maxTokens: integer("max_tokens").default(2048),
  tools: text("tools").array(),
  nodes: text("nodes"),
  edges: text("edges"),
  totalRuns: integer("total_runs").default(0),
  totalTokensUsed: integer("total_tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Conversations ────────────────────────────────────────────────────────────
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: conversationStatusEnum("status").notNull().default("active"),
  totalMessages: integer("total_messages").default(0),
  totalTokens: integer("total_tokens").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Usage Logs ───────────────────────────────────────────────────────────────
export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  tokensInput: integer("tokens_input").notNull().default(0),
  tokensOutput: integer("tokens_output").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  model: text("model").notNull(),
  costEstimate: real("cost_estimate").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const agentRelations = relations(agents, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
  usageLogs: many(usageLogs),
  memories: many(memories),
}));

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    agent: one(agents, {
      fields: [conversations.agentId],
      references: [agents.id],
    }),
    messages: many(messages),
    usageLogs: many(usageLogs),
  })
);

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  agent: one(agents, {
    fields: [messages.agentId],
    references: [agents.id],
  }),
}));

// ─── Memories (persistent agent memory) ──────────────────────────────────────
export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  importance: integer("importance").default(5), // 1-10
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memoryRelations = relations(memories, ({ one }) => ({
  agent: one(agents, { fields: [memories.agentId], references: [agents.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────
export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
