"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { GEMINI_MODELS } from "@/lib/gemini";

const AGENT_TYPES = [
  { value: "email",    label: "Email Agent",    icon: "📧", desc: "Draft, analyze, and automate emails" },
  { value: "research", label: "Research Agent", icon: "🔍", desc: "Deep research and fact-checking" },
  { value: "stock",    label: "Stock Agent",    icon: "📈", desc: "Market analysis and stock insights" },
  { value: "code",     label: "Code Agent",     icon: "💻", desc: "Write, review, and debug code" },
  { value: "custom",   label: "Custom Agent",   icon: "⚙️", desc: "Build your own with a custom prompt" },
];

const DEFAULT_PROMPTS: Record<string, string> = {
  email:    "You are an expert email assistant. Help draft professional and effective emails.",
  research: "You are a comprehensive research assistant. Provide thorough, well-structured analysis.",
  stock:    "You are a financial analysis assistant. Analyze stocks and market trends with clear disclaimers.",
  code:     "You are an expert software engineer. Write clean, efficient, well-documented code.",
  custom:   "",
};

const TYPE_DEFAULTS: Record<string, { temperature: number; maxTokens: number }> = {
  email:    { temperature: 0.7, maxTokens: 2048 },
  research: { temperature: 0.3, maxTokens: 4096 },
  stock:    { temperature: 0.2, maxTokens: 3000 },
  code:     { temperature: 0.1, maxTokens: 8192 },
  custom:   { temperature: 0.7, maxTokens: 2048 },
};

export default function CreateAgentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initialType = searchParams.get("type") ?? "custom";
  const initialDefaults = TYPE_DEFAULTS[initialType] ?? TYPE_DEFAULTS.custom;
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: initialType,
    systemPrompt: DEFAULT_PROMPTS[initialType] ?? "",
    model: GEMINI_MODELS.FLASH as string,
    temperature: initialDefaults.temperature,
    maxTokens: initialDefaults.maxTokens,
  });

  function handleTypeChange(type: string) {
    const defaults = TYPE_DEFAULTS[type] ?? TYPE_DEFAULTS.custom;
    setForm((f) => ({
      ...f,
      type,
      systemPrompt: DEFAULT_PROMPTS[type] ?? "",
      temperature: defaults.temperature,
      maxTokens: defaults.maxTokens,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { setError("Please wait while your account loads, then try again."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create agent.");
      if (!data.agent?.id) throw new Error("Agent created but no ID returned. Please try again.");
      router.push(`/dashboard/agents/${data.agent.id}/builder`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Agent Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Agent Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {AGENT_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => handleTypeChange(t.value)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                form.type === t.value
                  ? "border-primary-500 bg-primary-500/10 text-white"
                  : "border-slate-700 bg-dark-800 text-slate-400 hover:border-slate-600"
              }`}>
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs font-semibold">{t.label}</div>
              <div className="text-xs opacity-60 mt-0.5 line-clamp-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Agent Name <span className="text-red-400">*</span></label>
        <input type="text" required value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Sales Email Writer"
          className="w-full bg-dark-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors" />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description <span className="text-red-400">*</span></label>
        <input type="text" required value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What does this agent do?"
          className="w-full bg-dark-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors" />
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">System Prompt <span className="text-red-400">*</span></label>
        <textarea required rows={5} value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          placeholder="Instructions that define your agent's behavior..."
          className="w-full bg-dark-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors resize-none font-mono" />
      </div>

      {/* Advanced Settings */}
      <details className="group">
        <summary className="text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300 flex items-center gap-2">
          <span className="group-open:rotate-90 transition-transform">▶</span>
          Advanced Settings
        </summary>
        <div className="mt-4 space-y-4 pl-4 border-l border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Model</label>
            <select value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="w-full bg-dark-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500">
              <option value={GEMINI_MODELS.FLASH}>Gemini 2.0 Flash (Recommended)</option>
              <option value={GEMINI_MODELS.FLASH_LITE}>Gemini 2.0 Flash Lite (Faster)</option>
              <option value={GEMINI_MODELS.PRO}>Gemini 1.5 Pro (Most capable)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Temperature: {form.temperature}</label>
            <input type="range" min="0" max="1" step="0.1" value={form.temperature}
              onChange={(e) => setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Precise (0)</span><span>Creative (1)</span></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Max Tokens</label>
            <input type="number" min="256" max="8192" step="256" value={form.maxTokens}
              onChange={(e) => setForm((f) => ({ ...f, maxTokens: parseInt(e.target.value) }))}
              className="w-full bg-dark-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500" />
          </div>
        </div>
      </details>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
        ) : "Create Agent & Open Builder →"}
      </button>
    </form>
  );
}
