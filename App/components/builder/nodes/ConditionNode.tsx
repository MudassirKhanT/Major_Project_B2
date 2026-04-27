"use client";

import { Handle, Position } from "reactflow";

interface Props {
  data: { label: string; description: string };
  selected?: boolean;
}

export default function ConditionNode({ data, selected }: Props) {
  return (
    <div
      className={`min-w-[180px] rounded-xl border-2 bg-dark-800 p-4 shadow-lg transition-all ${
        selected
          ? "border-amber-400 shadow-amber-500/30 shadow-lg"
          : "border-amber-600/40 hover:border-amber-500/60"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-amber-500 border-2 border-dark-800"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">
          🔀
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Condition</p>
          <p className="text-sm font-bold text-white">{data.label}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">{data.description}</p>
      {/* Two outputs: true / false */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: "35%" }}
        className="w-3 h-3 bg-green-500 border-2 border-dark-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: "65%" }}
        className="w-3 h-3 bg-red-500 border-2 border-dark-800"
      />
      <div className="absolute right-[-28px] top-[28%] text-green-400 text-xs font-bold">T</div>
      <div className="absolute right-[-28px] top-[56%] text-red-400 text-xs font-bold">F</div>
    </div>
  );
}
