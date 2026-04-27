import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { apiLimiter } from "@/lib/arcjet";
import { getUserStats, getAgentStats } from "@/lib/db/queries/usage";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (apiLimiter) {
    const decision = await apiLimiter.protect(req, { userId });
    if (decision.isDenied()) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    const stats = agentId
      ? await getAgentStats(agentId)
      : await getUserStats(userId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("GET /api/usage:", error);
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 });
  }
}
