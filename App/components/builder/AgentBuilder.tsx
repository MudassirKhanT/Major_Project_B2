"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node, Edge, addEdge, Connection,
  useNodesState, useEdgesState,
  Background, Controls, MiniMap,
  BackgroundVariant, NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAgent, updateAgent } from "@/hooks/useAgents";
import Link from "next/link";
import TriggerNode from "./nodes/TriggerNode";
import ActionNode from "./nodes/ActionNode";
import OutputNode from "./nodes/OutputNode";
import ConditionNode from "./nodes/ConditionNode";

const nodeTypes: NodeTypes = { trigger: TriggerNode, action: ActionNode, output: OutputNode, condition: ConditionNode };

const DEFAULT_NODES: Node[] = [
  { id: "trigger-1", type: "trigger", position: { x: 100, y: 200 }, data: { label: "User Input", description: "Receives user message" } },
  { id: "action-1",  type: "action",  position: { x: 380, y: 200 }, data: { label: "AI Processing", description: "Gemini AI generates response" } },
  { id: "output-1",  type: "output",  position: { x: 660, y: 200 }, data: { label: "Send Response", description: "Returns output to user" } },
];

const DEFAULT_EDGES: Edge[] = [
  { id: "e1-2", source: "trigger-1", target: "action-1", animated: true },
  { id: "e2-3", source: "action-1",  target: "output-1", animated: true },
];

export default function AgentBuilder({ agentId }: { agentId: string }) {
  const { agent, loading: agentLoading } = useAgent(agentId);
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (agent?.nodes && agent?.edges) {
      try { setNodes(JSON.parse(agent.nodes)); setEdges(JSON.parse(agent.edges)); } catch {}
    }
  }, [agent, setNodes, setEdges]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)),
    [setEdges]
  );

  async function handleSave() {
    setSaving(true);
    try {
      await updateAgent(agentId, { nodes: JSON.stringify(nodes), edges: JSON.stringify(edges), status: "active" } as never);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  function addNode(type: "action" | "condition") {
    const id = `${type}-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id, type,
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: type === "action" ? "New Action" : "Condition", description: "Edit this node" },
    }]);
  }

  if (agentLoading) return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!agent) return (
    <div className="h-full flex items-center justify-center flex-col gap-3 text-center">
      <p className="text-slate-400">Failed to load agent. It may not exist or you may not have access.</p>
      <a href="/dashboard/agents" className="text-primary-400 hover:text-primary-300 text-sm underline">← Back to Agents</a>
    </div>
  );

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="flex items-center justify-between px-5 py-3 bg-dark-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/agents/${agentId}`} className="text-slate-400 hover:text-white text-sm">← Back</Link>
          <div className="w-px h-4 bg-slate-700" />
          <span className="font-semibold text-white text-sm">{agent.name}</span>
          <span className="text-xs text-slate-500">Flow Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => addNode("action")} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-slate-700 transition-colors">+ Action</button>
          <button onClick={() => addNode("condition")} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-slate-700 transition-colors">+ Condition</button>
          <div className="w-px h-4 bg-slate-700" />
          <button onClick={handleSave} disabled={saving}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${saved ? "bg-green-600 text-white" : "bg-primary-600 hover:bg-primary-500 text-white"}`}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Flow"}
          </button>
          <Link href={`/dashboard/agents/${agentId}/run`}
            className="px-4 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">▶ Run Agent</Link>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} nodeTypes={nodeTypes} fitView
          defaultEdgeOptions={{ style: { stroke: "#6366f1", strokeWidth: 2 }, animated: true }}>
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
          <Controls />
          <MiniMap nodeColor={(n) => ({ trigger: "#6366f1", action: "#0ea5e9", condition: "#f59e0b", output: "#22c55e" }[n.type ?? ""] ?? "#64748b")} maskColor="rgba(0,0,0,0.6)" />
        </ReactFlow>
      </div>
    </div>
  );
}
