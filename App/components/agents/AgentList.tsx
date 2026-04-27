"use client";

import { useAgents, deleteAgent, updateAgent } from "@/hooks/useAgents";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const TYPE_CONFIG: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  email: { icon: "📧", bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/20" },
  research: { icon: "🔍", bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
  stock: { icon: "📈", bg: "bg-green-500/10", text: "text-green-300", border: "border-green-500/20" },
  code: { icon: "💻", bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/20" },
  custom: { icon: "⚙️", bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20" },
};

export default function AgentList() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type") as "email" | "research" | "stock" | "code" | "custom" | null;
  const { agents, loading, refetch } = useAgents(typeFilter ?? undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    setDeleting(id);
    await deleteAgent(id);
    await refetch();
    setDeleting(null);
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    await updateAgent(id, { status: currentStatus === "active" ? "inactive" : "active" } as never);
    await refetch();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agents?.length) {
    return (
      <div className="text-center py-20 bg-dark-900 border border-slate-800 rounded-xl">
        <div className="text-5xl mb-4">🤖</div>
        <h3 className="text-white font-semibold mb-2">No agents yet</h3>
        <p className="text-slate-400 text-sm mb-6">Create your first AI agent to get started</p>
        <Link href="/dashboard/agents/new" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors">
          Create Agent
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const conf = TYPE_CONFIG[agent.type] ?? TYPE_CONFIG.custom;
        return (
          <div key={agent.id} className="bg-dark-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200 flex flex-col">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl ${conf.bg} border ${conf.border}`}>
                {conf.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{agent.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{agent.description}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs border capitalize ${
                agent.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : agent.status === "draft" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
              }`}>
                {agent.status}
              </span>
            </div>

            <div className="flex gap-4 text-xs text-slate-500 mb-5">
              <span>{agent.totalRuns ?? 0} runs</span>
              <span>{agent.totalTokensUsed ? `${(agent.totalTokensUsed / 1000).toFixed(1)}K tokens` : "0 tokens"}</span>
              <span className={`${conf.text} capitalize`}>{agent.type}</span>
            </div>

            <div className="flex gap-2 mt-auto">
              <Link href={`/dashboard/agents/${agent.id}/run`}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg text-center transition-colors">
                ▶ Run
              </Link>
              <Link href={`/dashboard/agents/${agent.id}/builder`}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors" title="Open builder">
                🔧
              </Link>
              <button onClick={() => handleToggleStatus(agent.id, agent.status)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-colors">
                {agent.status === "active" ? "⏸" : "▶"}
              </button>
              <button onClick={() => handleDelete(agent.id)} disabled={deleting === agent.id}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors">
                {deleting === agent.id ? "..." : "🗑"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
