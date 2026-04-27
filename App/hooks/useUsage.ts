"use client";

import { useState, useEffect, useCallback } from "react";

export interface UsageStats {
  totalRuns: number;
  totalTokens: number;
  totalCost: number;
  logs: {
    id: string;
    model: string;
    totalTokens: number;
    costEstimate: number | null;
    createdAt: string;
  }[];
}

export function useUsage(agentId?: string) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const url = agentId ? `/api/usage?agentId=${agentId}` : "/api/usage";
      const res = await fetch(url);
      const data = await res.json();
      setStats(data.stats ?? null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { stats, loading, refetch: fetch_ };
}
