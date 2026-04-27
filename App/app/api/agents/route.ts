import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { apiLimiter } from "@/lib/arcjet";
import {
  createAgent,
  listAgentsByUser,
  listAgentsByUserAndType,
} from "@/lib/db/queries/agents";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (apiLimiter) {
    const decision = await apiLimiter.protect(req, { userId });
    if (decision.isDenied()) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as
      | "email" | "research" | "stock" | "code" | "custom" | null;

    const agents = type
      ? await listAgentsByUserAndType(userId, type)
      : await listAgentsByUser(userId);

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("GET /api/agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (apiLimiter) {
    const decision = await apiLimiter.protect(req, { userId });
    if (decision.isDenied()) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, description, type, systemPrompt, model, temperature, maxTokens, tools, nodes, edges } = body;

    if (!name || !description || !type || !systemPrompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const agent = await createAgent({
      userId, name, description, type, systemPrompt,
      model, temperature, maxTokens, tools, nodes, edges,
      status: "draft",
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agents:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
