"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/agents": "My Agents",
  "/dashboard/agents/new": "Create Agent",
  "/dashboard/conversations": "Conversations",
  "/dashboard/usage": "Usage & Stats",
  "/dashboard/settings": "⚙ Settings",
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes("/agents/") && pathname.includes("/builder"))
    return "Agent Builder";
  if (pathname.includes("/agents/") && pathname.includes("/run"))
    return "Run Agent";
  if (pathname.includes("/agents/")) return "Agent Details";
  return "Agentify";
}

export default function Topbar() {
  const pathname = usePathname();

  return (
    <header className="h-14 bg-dark-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-white">{getTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-px h-5 bg-slate-700" />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    </header>
  );
}
