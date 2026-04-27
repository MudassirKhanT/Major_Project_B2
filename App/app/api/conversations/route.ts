import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { apiLimiter } from "@/lib/arcjet";
import {
  createConversation,
  listConversationsByUser,
  listConversationsByAgent,
} from "@/lib/db/queries/conversations";

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

    const conversations = agentId
      ? await listConversationsByAgent(agentId)
      : await listConversationsByUser(userId);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { agentId, title } = await req.json();
    if (!agentId || !title) {
      return NextResponse.json({ error: "agentId and title are required" }, { status: 400 });
    }
    const conversation = await createConversation({ userId, agentId, title, status: "active" });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
