"use client";

import { useAgents } from "@/hooks/useAgents";
import { useConversations } from "@/hooks/useConversations";
import { useUsage } from "@/hooks/useUsage";

export default function DashboardStats() {
  const { agents } = useAgents();
  const { conversations } = useConversations();
  const { stats } = useUsage();

  const statCards = [
    {
      label: "Total Agents",
      value: agents?.length ?? 0,
      icon: "🤖",
      color: "border-primary-600/30 bg-primary-600/10",
      textColor: "text-primary-300",
    },
    {
      label: "Active Agents",
      value: agents?.filter((a) => a.status === "active").length ?? 0,
      icon: "⚡",
      color: "border-green-600/30 bg-green-600/10",
      textColor: "text-green-300",
    },
    {
      label: "Total Conversations",
      value: conversations?.length ?? 0,
      icon: "💬",
      color: "border-blue-600/30 bg-blue-600/10",
      textColor: "text-blue-300",
    },
    {
      label: "Tokens Used",
      value: stats ? formatTokens(stats.totalTokens) : "0",
      icon: "🔢",
      color: "border-purple-600/30 bg-purple-600/10",
      textColor: "text-purple-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <div key={stat.label} className={`rounded-xl border ${stat.color} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
          <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
