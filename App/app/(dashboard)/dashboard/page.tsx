import Link from "next/link";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentAgents from "@/components/dashboard/RecentAgents";
import RecentConversations from "@/components/dashboard/RecentConversations";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome back 👋</h2>
          <p className="text-slate-400 text-sm mt-1">Manage and monitor your AI agents from here</p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
        >
          <span>+</span> New Agent
        </Link>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentAgents />
        </div>
        <div>
          <RecentConversations />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Quick Start Templates
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: "email",    icon: "📧", label: "Email Agent",    desc: "Draft & automate emails" },
            { type: "research", icon: "🔍", label: "Research Agent", desc: "Deep research & analysis" },
            { type: "stock",    icon: "📈", label: "Stock Agent",    desc: "Market analysis insights" },
            { type: "code",     icon: "💻", label: "Code Agent",     desc: "Write & review code" },
          ].map((t) => (
            <Link
              key={t.type}
              href={`/dashboard/agents/new?type=${t.type}`}
              className="border border-slate-700 hover:border-indigo-500 bg-white/5 hover:bg-indigo-500/10 rounded-xl p-4 transition-all duration-200"
            >
              <div className="text-2xl mb-3">{t.icon}</div>
              <p className="font-semibold text-white text-sm">{t.label}</p>
              <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
