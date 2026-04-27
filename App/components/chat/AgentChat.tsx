"use client";

import { useState, useRef, useEffect } from "react";
import { useAgent, useAgents } from "@/hooks/useAgents";
import Link from "next/link";
import MessageBubble from "./MessageBubble";
import { toast } from "sonner";
import { MessageSkeleton } from "@/components/ui/Skeleton";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  email: "📧", research: "🔍", stock: "📈", code: "💻", custom: "⚙️",
};

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  email:    ["Draft a follow-up email to a client who hasn't responded in 2 weeks", "Write a professional resignation letter", "Create a cold outreach email for B2B sales"],
  research: ["Research the impact of AI on the job market in 2024", "Competitive analysis of Tesla vs traditional automakers", "Latest trends in renewable energy"],
  stock:    ["Analyze NVIDIA's recent performance and outlook", "What factors should I consider before investing in tech stocks?", "Impact of rising interest rates on growth stocks"],
  code:     ["Write a React hook for debounced search", "Review this code for SQL injection vulnerabilities", "Explain the difference between useMemo and useCallback"],
  custom:   ["Hello! What can you help me with?", "What are your capabilities?"],
};

export default function AgentChat({ agentId }: { agentId: string }) {
  const { agent, loading: agentLoading } = useAgent(agentId);
  const { agents: allAgents } = useAgents();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);
  const [showMultiAgent, setShowMultiAgent] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [orchMode, setOrchMode] = useState<"sequential" | "parallel">("sequential");
  const [orchLoading, setOrchLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!agentId) return;
    fetch(`/api/memory?agentId=${agentId}`)
      .then((r) => r.json())
      .then((d) => setMemoryCount(d.memories?.length ?? 0))
      .catch(() => {});
  }, [agentId, messages.length]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMsg: Message = { role: "user", content };
    const assistantPlaceholder: Message = { role: "assistant", content: "", streaming: true };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content },
    ];

    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, conversationId, stream: true }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              fullText += data.text;
              setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: fullText, streaming: true }; return u; });
            }
            if (data.done) {
              if (data.conversationId) setConversationId(data.conversationId);
              if (data.tokensUsed) setTokensUsed((t) => t + data.tokensUsed);
              setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: fullText, streaming: false }; return u; });
            }
          } catch { /* skip malformed frames */ }
        }
      }
      // flush any remaining buffer
      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.conversationId) setConversationId(data.conversationId);
          if (data.tokensUsed) setTokensUsed((t) => t + data.tokensUsed);
        } catch { /* ignore */ }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast.error(msg);
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `❌ Error: ${msg}`, streaming: false }; return u; });
    } finally {
      setLoading(false);
    }
  }

  async function runOrchestration() {
    if (!input.trim() || !selectedAgents.length) { toast.error("Enter a task and select at least one agent"); return; }
    setOrchLoading(true);
    const task = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `🤝 [Multi-Agent Task]\n${task}` },
      { role: "assistant", content: "⏳ Orchestrating agents, please wait...", streaming: true },
    ]);

    try {
      const res = await fetch("/api/agents/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, agentIds: [agentId, ...selectedAgents], mode: orchMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content: `🤝 **Multi-Agent Result** (${data.agentResults?.length} agents, ${data.totalTokens?.toLocaleString()} tokens)\n\n${data.finalAnswer}`,
          streaming: false,
        };
        return u;
      });
      setTokensUsed((t) => t + (data.totalTokens ?? 0));
      toast.success(`Done! ${data.agentResults?.length} agents collaborated`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Orchestration failed";
      toast.error(msg);
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `❌ ${msg}`, streaming: false }; return u; });
    } finally {
      setOrchLoading(false);
      setShowMultiAgent(false);
    }
  }

  async function clearMemory() {
    if (!confirm("Clear all memories for this agent?")) return;
    await fetch("/api/memory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId }) });
    setMemoryCount(0);
    toast.success("Memory cleared");
  }

  function copyConversation() {
    const text = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  if (agentLoading) {
    return (
      <div className="flex flex-col h-full -m-6">
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-1.5"><div className="w-32 h-4 bg-slate-800 rounded animate-pulse" /><div className="w-20 h-3 bg-slate-800 rounded animate-pulse" /></div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-6">{[1, 2, 3].map((i) => <MessageSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-4xl mb-3">🤖</p>
        <p className="text-white font-semibold">Agent not found</p>
        <Link href="/dashboard/agents" className="mt-3 text-indigo-400 text-sm hover:underline">← Back to agents</Link>
      </div>
    );
  }

  const examples = EXAMPLE_PROMPTS[agent.type] ?? EXAMPLE_PROMPTS.custom;
  const icon = TYPE_ICONS[agent.type] ?? "⚙️";
  const otherAgents = allAgents?.filter((a) => a.id !== agentId) ?? [];

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/agents" className="text-slate-400 hover:text-white text-sm px-1">←</Link>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg">{icon}</div>
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              {agent.name}
              {memoryCount > 0 && (
                <span onClick={clearMemory} title="Click to clear"
                  className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 cursor-pointer hover:bg-purple-500/30">
                  🧠 {memoryCount}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 capitalize">{agent.type} agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tokensUsed > 0 && <span className="text-xs text-slate-500 hidden sm:block">{tokensUsed.toLocaleString()} tokens</span>}
          {otherAgents.length > 0 && (
            <button onClick={() => setShowMultiAgent(!showMultiAgent)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${showMultiAgent ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" : "bg-white/5 hover:bg-white/10 text-slate-300 border-slate-700"}`}>
              🤝 Multi-Agent
            </button>
          )}
          {messages.length > 0 && <>
            <button onClick={copyConversation} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-slate-700" title="Copy conversation">📋</button>
            <button onClick={() => { setMessages([]); setConversationId(null); setTokensUsed(0); }} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-slate-700">New Chat</button>
          </>}
          <Link href={`/dashboard/agents/${agentId}/builder`} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-slate-700">🔧</Link>
        </div>
      </div>

      {/* Multi-agent panel */}
      {showMultiAgent && (
        <div className="px-5 py-3 bg-indigo-950/40 border-b border-indigo-800/40 shrink-0">
          <p className="text-xs font-semibold text-indigo-300 mb-2">🤝 Select agents to collaborate with:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {otherAgents.map((a) => (
              <button key={a.id}
                onClick={() => setSelectedAgents((prev) => prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id])}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${selectedAgents.includes(a.id) ? "bg-indigo-500/30 border-indigo-500 text-indigo-200" : "bg-white/5 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                {TYPE_ICONS[a.type] ?? "⚙️"} {a.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select value={orchMode} onChange={(e) => setOrchMode(e.target.value as "sequential" | "parallel")}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white">
              <option value="sequential">Sequential (smart delegation)</option>
              <option value="parallel">Parallel (all at once, then synthesize)</option>
            </select>
            <button onClick={runOrchestration} disabled={orchLoading || !selectedAgents.length || !input.trim()}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg font-medium">
              {orchLoading ? "Running..." : "Run →"}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mx-auto mb-4">{icon}</div>
              <h2 className="text-xl font-bold text-white mb-2">{agent.name}</h2>
              <p className="text-slate-400 text-sm">{agent.description}</p>
              {agent.type === "email" && (
                <p className="mt-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 inline-block">
                  📧 Can draft AND send real emails — just ask to send one!
                </p>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">Try asking...</p>
            <div className="space-y-2">
              {examples.map((ex) => (
                <button key={ex} onClick={() => sendMessage(ex)}
                  className="w-full text-left px-4 py-3 bg-slate-900 hover:bg-white/5 border border-slate-800 hover:border-slate-700 rounded-xl text-sm text-slate-300 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
            {(loading || orchLoading) && messages[messages.length - 1]?.streaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm shrink-0">{icon}</div>
                <div className="flex items-center gap-1 px-4 py-3 bg-slate-900 rounded-2xl rounded-tl-sm">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={showMultiAgent && selectedAgents.length > 0 ? "Enter task for all selected agents..." : `Message ${agent.name}… (Enter to send, Shift+Enter for new line)`}
            rows={1} disabled={loading || orchLoading}
            className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32 disabled:opacity-50 transition-colors"
            onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 128) + "px"; }} />
          <button
            onClick={() => showMultiAgent && selectedAgents.length > 0 ? runOrchestration() : sendMessage(input)}
            disabled={loading || orchLoading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors">
            {loading || orchLoading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          AI can make mistakes. {agent.type === "email" ? "Email agent can send real emails. " : ""}Verify important information.
        </p>
      </div>
    </div>
  );
}
