"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAgents } from "@/hooks/useAgents";
import { useUsage } from "@/hooks/useUsage";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { agents } = useAgents();
  const { stats } = useUsage();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Profile Card */}
      <div className="bg-dark-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary-600/30 to-cyan-600/20" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-20 h-20 rounded-2xl border-4 border-dark-900 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-4 border-dark-900 bg-primary-600 flex items-center justify-center text-2xl font-bold text-white">
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white">
            {user?.fullName ?? "User"}
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {user?.primaryEmailAddress?.emailAddress}
          </p>

          {user?.username && (
            <p className="text-xs text-slate-500 mt-1">@{user.username}</p>
          )}

          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-slate-800/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{agents?.length ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Agents</p>
            </div>
            <div className="flex-1 bg-slate-800/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">{stats?.totalRuns ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total Runs</p>
            </div>
            <div className="flex-1 bg-slate-800/60 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-white">
                {(stats?.totalTokens ?? 0) >= 1000
                  ? `${((stats?.totalTokens ?? 0) / 1000).toFixed(1)}K`
                  : stats?.totalTokens ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Tokens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-dark-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Full Name</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.fullName ?? "—"}</p>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Email Address</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.primaryEmailAddress?.emailAddress ?? "—"}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs border ${
            user?.primaryEmailAddress?.verification?.status === "verified"
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          }`}>
            {user?.primaryEmailAddress?.verification?.status === "verified" ? "Verified" : "Unverified"}
          </span>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Member Since</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "—"}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">User ID</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.id ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Manage Profile via Clerk */}
      <div className="bg-dark-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manage</p>
        </div>

        <a
          href={`https://accounts.clerk.dev/user`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div>
            <p className="text-sm font-medium text-white">Edit Profile</p>
            <p className="text-xs text-slate-400 mt-0.5">Change name, photo, and password</p>
          </div>
          <span className="text-slate-400 text-sm">↗</span>
        </a>

        <div
          onClick={() => router.push("/dashboard/usage")}
          className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div>
            <p className="text-sm font-medium text-white">Usage & Billing</p>
            <p className="text-xs text-slate-400 mt-0.5">Token usage and cost estimates</p>
          </div>
          <span className="text-slate-400 text-sm">→</span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-900 border border-red-900/30 rounded-xl divide-y divide-slate-800">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-red-500/80 uppercase tracking-wider">Danger Zone</p>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Sign Out</p>
            <p className="text-xs text-slate-400 mt-0.5">Sign out of your account on this device</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

    </div>
  );
}
