import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getConversationById } from "@/lib/db/queries/conversations";
import { listMessagesByConversation } from "@/lib/db/queries/messages";

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const conversation = await getConversationById(params.id);
    if (!conversation || conversation.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const messages = await listMessagesByConversation(params.id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/conversations/[id]/messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
