"use client";

import { Handle, Position } from "reactflow";

interface Props {
  data: { label: string; description: string };
  selected?: boolean;
}

export default function OutputNode({ data, selected }: Props) {
  return (
    <div
      className={`min-w-[180px] rounded-xl border-2 bg-dark-800 p-4 shadow-lg transition-all ${
        selected
          ? "border-green-400 shadow-green-500/30 shadow-lg"
          : "border-green-600/40 hover:border-green-500/60"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-dark-800"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">
          📤
        </div>
        <div>
          <p className="text-xs font-semibold text-green-300 uppercase tracking-wide">Output</p>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">{data.description}</p>
    </div>
  );
}
