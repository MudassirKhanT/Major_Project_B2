"use client";

import { useState, useEffect, useCallback } from "react";

export interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  title: string;
  status: "active" | "completed" | "failed";
  totalMessages: number | null;
  totalTokens: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useConversations(agentId?: string) {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const url = agentId
        ? `/api/conversations?agentId=${agentId}`
        : "/api/conversations";
      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { conversations, loading, refetch: fetch_ };
}

export async function deleteConversation(id: string) {
  await fetch(`/api/conversations/${id}`, { method: "DELETE" });
}
