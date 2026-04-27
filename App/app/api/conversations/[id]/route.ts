import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getConversationById,
  deleteConversation,
} from "@/lib/db/queries/conversations";

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const conversation = await getConversationById(params.id);
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("GET /api/conversations/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const conversation = await getConversationById(params.id);
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await deleteConversation(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/conversations/[id]:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
