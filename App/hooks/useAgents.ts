"use client";

import { useState, useEffect, useCallback } from "react";

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: "email" | "research" | "stock" | "code" | "custom";
  status: "active" | "inactive" | "draft";
  systemPrompt: string;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  tools: string[] | null;
  nodes: string | null;
  edges: string | null;
  totalRuns: number | null;
  totalTokensUsed: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useAgents(type?: string) {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const url = type ? `/api/agents?type=${type}` : "/api/agents";
      const res = await fetch(url);
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { agents, loading, refetch: fetch_ };
}

export function useAgent(id: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${id}`);
      const data = await res.json();
      setAgent(data.agent ?? null);
    } catch {
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { agent, loading, refetch: fetch_ };
}

export async function createAgent(body: Partial<Agent>) {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function updateAgent(id: string, body: Partial<Agent>) {
  const res = await fetch(`/api/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function deleteAgent(id: string) {
  await fetch(`/api/agents/${id}`, { method: "DELETE" });
}
