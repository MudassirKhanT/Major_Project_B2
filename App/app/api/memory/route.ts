import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getMemoriesForAgent, clearAgentMemories, deleteMemory } from "@/lib/db/queries/memories";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  const mems = await getMemoriesForAgent(userId, agentId);
  return NextResponse.json({ memories: mems });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, memoryId } = await req.json();

  if (memoryId) {
    await deleteMemory(memoryId);
  } else if (agentId) {
    await clearAgentMemories(userId, agentId);
  } else {
    return NextResponse.json({ error: "agentId or memoryId required" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
