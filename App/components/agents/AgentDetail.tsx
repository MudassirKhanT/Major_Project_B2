"use client";

import { useAgent, deleteAgent, updateAgent } from "@/hooks/useAgents";
import { useConversations } from "@/hooks/useConversations";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props { agentId: string; userId: string }

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  email:    { icon: "📧", color: "bg-blue-500/20 text-blue-300" },
  research: { icon: "🔍", color: "bg-purple-500/20 text-purple-300" },
  stock:    { icon: "📈", color: "bg-green-500/20 text-green-300" },
  code:     { icon: "💻", color: "bg-yellow-500/20 text-yellow-300" },
  custom:   { icon: "⚙️", color: "bg-slate-500/20 text-slate-300" },
};

export default function AgentDetail({ agentId, userId }: Props) {
  const { agent, loading, refetch } = useAgent(agentId);
  const { conversations } = useConversations(agentId);
  const router = useRouter();

  if (loading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!agent) return <p className="text-red-400">Agent not found.</p>;
  if (agent.userId !== userId) return <p className="text-red-400">Access denied.</p>;

  const conf = TYPE_CONFIG[agent.type] ?? TYPE_CONFIG.custom;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${conf.color}`}>{conf.icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{agent.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${
                agent.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30"
                : agent.status === "draft" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
              }`}>{agent.status}</span>
              <span className="text-xs text-slate-500 capitalize">{agent.type} · {agent.model ?? "gemini-2.0-flash"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/agents/${agentId}/run`}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors">▶ Run</Link>
          <Link href={`/dashboard/agents/${agentId}/builder`}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-slate-700 transition-colors">🔧 Builder</Link>
          <button onClick={async () => {
            const next = agent.status === "active" ? "inactive" : "active";
            await updateAgent(agentId, { status: next } as never);
            refetch();
          }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm text-white rounded-lg border border-slate-700 transition-colors">
            {agent.status === "active" ? "⏸ Pause" : "▶ Activate"}
          </button>
          <button onClick={async () => {
            if (confirm("Delete this agent?")) {
              await deleteAgent(agentId);
              router.push("/dashboard/agents");
            }
          }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors">
            🗑 Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Runs", value: agent.totalRuns ?? 0 },
          { label: "Tokens Used", value: agent.totalTokensUsed ? `${(agent.totalTokensUsed / 1000).toFixed(1)}K` : "0" },
          { label: "Conversations", value: conversations?.length ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-dark-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-dark-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-white text-sm mb-3">System Prompt</h3>
        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">{agent.systemPrompt}</pre>
      </div>

      {conversations && conversations.length > 0 && (
        <div className="bg-dark-900 border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-semibold text-white text-sm">Recent Conversations</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {conversations.slice(0, 5).map((conv) => (
              <div key={conv.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1">
                  <p className="text-sm text-white truncate">{conv.title}</p>
                  <p className="text-xs text-slate-500">{conv.totalMessages ?? 0} messages · {conv.totalTokens ?? 0} tokens</p>
                </div>
                <Link href={`/dashboard/agents/${agentId}/run`} className="text-xs text-primary-400 hover:text-primary-300">Continue →</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
