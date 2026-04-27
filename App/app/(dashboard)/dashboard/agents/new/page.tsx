import { Suspense } from "react";
import CreateAgentForm from "@/components/agents/CreateAgentForm";

export default function NewAgentPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
        <p className="text-slate-400 text-sm mt-1">
          Configure your AI agent&apos;s personality, capabilities, and settings
        </p>
      </div>
      {/* CreateAgentForm uses useSearchParams — must be in Suspense */}
      <Suspense fallback={<div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />)}</div>}>
        <CreateAgentForm />
      </Suspense>
    </div>
  );
}
