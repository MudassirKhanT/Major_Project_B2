"use client";

import { Handle, Position } from "reactflow";

interface Props {
  data: { label: string; description: string };
  selected?: boolean;
}

export default function ActionNode({ data, selected }: Props) {
  return (
    <div
      className={`min-w-[180px] rounded-xl border-2 bg-dark-800 p-4 shadow-lg transition-all ${
        selected
          ? "border-sky-400 shadow-sky-500/30 shadow-lg"
          : "border-sky-600/40 hover:border-sky-500/60"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-sky-500 border-2 border-dark-800"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sm">
          🔄
        </div>
        <div>
          <p className="text-xs font-semibold text-sky-300 uppercase tracking-wide">Action</p>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">{data.description}</p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-sky-500 border-2 border-dark-800"
      />
    </div>
  );
}
