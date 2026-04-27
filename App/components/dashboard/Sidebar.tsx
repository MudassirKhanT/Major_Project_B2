"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "⊞", label: "Dashboard" },
  { href: "/dashboard/agents", icon: "🤖", label: "My Agents" },
  { href: "/dashboard/agents/new", icon: "✦", label: "Create Agent" },
  { href: "/dashboard/conversations", icon: "💬", label: "Conversations" },
  { href: "/dashboard/usage", icon: "📊", label: "Usage & Stats" },
];

const AGENT_TEMPLATES = [
  { href: "/dashboard/agents?type=email", icon: "📧", label: "Email Agent", color: "text-blue-400" },
  { href: "/dashboard/agents?type=research", icon: "🔍", label: "Research Agent", color: "text-purple-400" },
  { href: "/dashboard/agents?type=stock", icon: "📈", label: "Stock Agent", color: "text-green-400" },
  { href: "/dashboard/agents?type=code", icon: "💻", label: "Code Agent", color: "text-yellow-400" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dark-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Agentify</span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary-600/20 text-primary-300 border border-primary-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Agent Templates Section */}
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Agent Types
          </p>
          {AGENT_TEMPLATES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-slate-400 hover:text-white hover:bg-white/5"
            >
              <span className={`text-base ${item.color}`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-800">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
            pathname === "/dashboard/settings"
              ? "bg-primary-600/20 text-primary-300 border border-primary-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>⚙</span>
          Settings
        </Link>
      </div>
    </aside>
  );
}
