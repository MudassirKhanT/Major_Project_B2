import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { runOrchestration } from "@/lib/agents/orchestrator";

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
