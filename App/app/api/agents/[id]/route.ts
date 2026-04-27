import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { apiLimiter } from "@/lib/arcjet";
import {
  getAgentById,
  updateAgent,
  deleteAgent,
} from "@/lib/db/queries/agents";

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const agent = await getAgentById(params.id);
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agent.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ agent });
  } catch (error) {
    console.error("GET /api/agents/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (apiLimiter) {
    const decision = await apiLimiter.protect(req, { userId });
    if (decision.isDenied()) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const agent = await getAgentById(params.id);
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agent.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updated = await updateAgent(params.id, body);
    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error("PUT /api/agents/[id]:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const agent = await getAgentById(params.id);
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agent.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await deleteAgent(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/agents/[id]:", error);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
