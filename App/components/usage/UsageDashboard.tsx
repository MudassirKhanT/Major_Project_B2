"use client";

import { useUsage } from "@/hooks/useUsage";
import { useAgents } from "@/hooks/useAgents";

export default function UsageDashboard() {
  const { stats, loading: statsLoading } = useUsage();
  const { agents, loading: agentsLoading } = useAgents();

  if (statsLoading || agentsLoading) {
    return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Total API Calls</p>
          <p className="text-3xl font-bold text-white">{(stats?.totalRuns ?? 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Agent executions</p>
        </div>
        <div className="bg-dark-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Total Tokens</p>
          <p className="text-3xl font-bold text-primary-300">
            {(stats?.totalTokens ?? 0) >= 1_000_000
              ? `${((stats?.totalTokens ?? 0) / 1_000_000).toFixed(2)}M`
              : (stats?.totalTokens ?? 0) >= 1_000
              ? `${((stats?.totalTokens ?? 0) / 1_000).toFixed(1)}K`
              : (stats?.totalTokens ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Input + output tokens</p>
        </div>
        <div className="bg-dark-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Est. Cost</p>
          <p className="text-3xl font-bold text-green-300">${(stats?.totalCost ?? 0).toFixed(4)}</p>
          <p className="text-xs text-slate-500 mt-1">USD (approximate)</p>
        </div>
      </div>

      {agents && agents.length > 0 && (
        <div className="bg-dark-900 border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-semibold text-white text-sm">Per-Agent Usage</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{agent.type} agent</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-medium">{agent.totalRuns ?? 0} runs</p>
                  <p className="text-xs text-slate-500">{agent.totalTokensUsed ? `${(agent.totalTokensUsed / 1000).toFixed(1)}K tokens` : "0 tokens"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.logs && stats.logs.length > 0 && (
        <div className="bg-dark-900 border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-semibold text-white text-sm">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {[...stats.logs].reverse().map((log, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 text-xs">
                <div className="flex-1 text-slate-400">{new Date(log.createdAt).toLocaleString()}</div>
                <div className="text-slate-300">{log.model}</div>
                <div className="text-slate-300">{log.totalTokens.toLocaleString()} tokens</div>
                <div className="text-green-400">${(log.costEstimate ?? 0).toFixed(5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
