import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow" />
          AI Agent Builder Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="text-white">Build Intelligent</span>
          <br />
          <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
            AI Agents
          </span>
        </h1>

        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create, configure, and deploy AI agents for email automation, market research,
          stock analysis, code generation, and more — all in one powerful platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/25 hover:shadow-primary-500/40 hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
          <Link
            href="/sign-in"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all duration-200"
          >
            Sign In
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
          {[
            { icon: "📧", label: "Email Agent", desc: "Draft & automate emails" },
            { icon: "🔍", label: "Research Agent", desc: "Deep-dive investigations" },
            { icon: "📈", label: "Stock Agent", desc: "Market analysis & insights" },
            { icon: "💻", label: "Code Agent", desc: "Write & review code" },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-white text-sm">{f.label}</div>
              <div className="text-xs text-slate-400 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
