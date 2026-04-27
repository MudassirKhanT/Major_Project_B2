"use client";

import { useConversations } from "@/hooks/useConversations";
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

export default function RecentConversations() {
  const { conversations, loading } = useConversations();

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h3 className="font-semibold text-white text-sm">Recent Chats</h3>
        <Link href="/dashboard/conversations" className="text-xs text-primary-400 hover:text-primary-300">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : !conversations?.length ? (
        <div className="p-8 text-center">
          <p className="text-slate-500 text-sm">No conversations yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {conversations.slice(0, 6).map((conv) => (
            <Link key={conv.id} href={`/dashboard/agents/${conv.agentId}/run`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs shrink-0 mt-0.5">💬</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{conv.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {timeAgo(conv.updatedAt)} · {conv.totalMessages ?? 0} msgs
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
