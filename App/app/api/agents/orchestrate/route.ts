import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { runOrchestration } from "@/lib/agents/orchestrator";
import { getAgentById } from "@/lib/db/queries/agents";

const VALID_MODES = ["sequential", "parallel", "auto"] as const;
type OrchestrationMode = (typeof VALID_MODES)[number];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { task, agentIds, mode = "auto" } = await req.json();

    if (!task || !agentIds?.length) {
      return NextResponse.json({ error: "task and agentIds are required" }, { status: 400 });
    }
    if (agentIds.length > 5) {
      return NextResponse.json({ error: "Maximum 5 agents per orchestration" }, { status: 400 });
    }
    if (!VALID_MODES.includes(mode as OrchestrationMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify all agents exist and belong to this user
    const agentChecks = await Promise.all((agentIds as string[]).map(getAgentById));
    for (let i = 0; i < agentChecks.length; i++) {
      const agent = agentChecks[i];
      if (!agent) {
        return NextResponse.json({ error: `Agent ${agentIds[i]} not found` }, { status: 404 });
      }
      if (agent.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const result = await runOrchestration({ task, agentIds, userId, mode });
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/agents/orchestrate:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Orchestration failed" },
      { status: 500 }
    );
  }
}
