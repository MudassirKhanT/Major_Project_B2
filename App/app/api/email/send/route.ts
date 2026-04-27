import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return NextResponse.json({ error: "Email sending not configured. Add RESEND_API_KEY to .env.local" }, { status: 503 });
  }

  try {
    const { to, subject, body, from } = await req.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject, and body are required" }, { status: 400 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_KEY);

    const { data, error } = await resend.emails.send({
      from: from ?? "Agentify <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body.replace(/\n/g, "<br/>"),
      text: body,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("POST /api/email/send:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
