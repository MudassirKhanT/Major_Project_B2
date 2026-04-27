import UsageDashboard from "@/components/usage/UsageDashboard";

export default function UsagePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Usage & Stats</h2>
        <p className="text-slate-400 text-sm mt-1">Token consumption and cost estimates</p>
      </div>
      <UsageDashboard />
    </div>
  );
}
