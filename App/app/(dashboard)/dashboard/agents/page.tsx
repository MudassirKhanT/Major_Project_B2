import Link from "next/link";
import { Suspense } from "react";
import AgentList from "@/components/agents/AgentList";
import { AgentCardSkeleton } from "@/components/ui/Skeleton";

function AgentListFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => <AgentCardSkeleton key={i} />)}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Agents</h2>
          <p className="text-slate-400 text-sm mt-1">All your AI agents in one place</p>
        </div>
        <Link href="/dashboard/agents/new"
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2">
          <span>+</span> New Agent
        </Link>
      </div>
      {/* AgentList uses useSearchParams() — must be wrapped in Suspense (Next.js 14 requirement) */}
      <Suspense fallback={<AgentListFallback />}>
        <AgentList />
      </Suspense>
    </div>
  );
}
