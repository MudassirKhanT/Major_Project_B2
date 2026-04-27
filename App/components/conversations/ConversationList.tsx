"use client";

import { useConversations, deleteConversation } from "@/hooks/useConversations";
import Link from "next/link";

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ConversationList() {
  const { conversations, loading, refetch } = useConversations();

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!conversations?.length) {
    return (
      <div className="text-center py-20 bg-dark-900 border border-slate-800 rounded-xl">
        <div className="text-5xl mb-4">💬</div>
        <h3 className="text-white font-semibold mb-2">No conversations yet</h3>
        <p className="text-slate-400 text-sm mb-6">Run an agent to start a conversation</p>
        <Link href="/dashboard/agents" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors">View Agents</Link>
      </div>
    );
  }

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
      {conversations.map((conv) => (
        <div key={conv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-lg shrink-0">💬</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{conv.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {timeAgo(conv.updatedAt)} · {conv.totalMessages ?? 0} messages · {conv.totalTokens ?? 0} tokens
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/dashboard/agents/${conv.agentId}/run`}
              className="px-3 py-1.5 text-xs bg-primary-600/20 hover:bg-primary-600/40 text-primary-300 rounded-lg transition-colors">Continue →</Link>
            <button onClick={async () => {
              if (confirm("Delete this conversation?")) {
                await deleteConversation(conv.id);
                refetch();
              }
            }} className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">Delete</button>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs border shrink-0 ${
            conv.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30"
            : conv.status === "failed" ? "bg-red-500/20 text-red-400 border-red-500/30"
            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
          }`}>{conv.status}</span>
        </div>
      ))}
    </div>
  );
}
