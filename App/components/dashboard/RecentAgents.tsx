"use client";

import { useAgents } from "@/hooks/useAgents";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  email: { icon: "📧", color: "bg-blue-500/20 text-blue-300" },
  research: { icon: "🔍", color: "bg-purple-500/20 text-purple-300" },
  stock: { icon: "📈", color: "bg-green-500/20 text-green-300" },
  code: { icon: "💻", color: "bg-yellow-500/20 text-yellow-300" },
  custom: { icon: "⚙️", color: "bg-slate-500/20 text-slate-300" },
};

const STATUS_CONFIG: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function RecentAgents() {
  const { agents, loading } = useAgents();

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h3 className="font-semibold text-white text-sm">Recent Agents</h3>
        <Link href="/dashboard/agents" className="text-xs text-primary-400 hover:text-primary-300">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : !agents?.length ? (
        <div className="p-8 text-center">
          <p className="text-slate-500 text-sm">No agents yet.</p>
          <Link href="/dashboard/agents/new" className="mt-2 inline-block text-xs text-primary-400 hover:text-primary-300">
            Create your first agent →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {agents.slice(0, 5).map((agent) => {
            const typeConf = TYPE_CONFIG[agent.type] ?? TYPE_CONFIG.custom;
            const statusConf = STATUS_CONFIG[agent.status];
            return (
              <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${typeConf.color}`}>
                  {typeConf.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                  <p className="text-xs text-slate-500 truncate">{agent.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{agent.totalRuns ?? 0} runs</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${statusConf}`}>{agent.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
