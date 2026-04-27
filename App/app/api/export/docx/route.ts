import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, UnderlineType,
} from "docx";

function buildDocx(text: string): Document {
  const lines = text.split("\n");
  const paragraphs: Paragraph[] = [];
  let i = 0;

  // Skip leading blank lines
  while (i < lines.length && !lines[i].trim()) i++;

  // First non-empty line = Name
  if (i < lines.length) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: lines[i].trim(), bold: true, size: 40, color: "1e293b" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }));
    i++;
  }

  // Contact info: lines with | @ + until blank line
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; break; }
    if (t.includes("@") || t.includes("|") || t.includes("+91") || t.includes("linkedin") || t.includes("github")) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t, size: 19, color: "475569" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }));
      i++;
    } else break;
  }

  // Divider
  paragraphs.push(new Paragraph({
    border: { bottom: { color: "3b82f6", size: 8, style: BorderStyle.SINGLE } },
    spacing: { after: 160 },
    children: [],
  }));

  // Body
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trim();

    if (!t) {
      paragraphs.push(new Paragraph({ children: [], spacing: { after: 60 } }));
      i++;
      continue;
    }

    // Section header: ALL CAPS, no bullets, reasonable length
    const isHeader =
      t === t.toUpperCase() &&
      t.length > 3 &&
      t.length < 80 &&
      !/^[•\-–]/.test(t) &&
      !/^\d+\./.test(t) &&
      /[A-Z]/.test(t);

    if (isHeader) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t, bold: true, size: 22, color: "1e40af" })],
        spacing: { before: 240, after: 80 },
        border: { bottom: { color: "93c5fd", size: 4, style: BorderStyle.SINGLE } },
      }));
      i++;
      continue;
    }

    // Bullet points
    if (/^[•\-–]\s?/.test(t)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: t.replace(/^[•\-–]\s*/, ""), size: 20, color: "1e293b" })],
        bullet: { level: 0 },
        spacing: { after: 60 },
        indent: { left: 360 },
      }));
      i++;
      continue;
    }

    // Bold lines: company/role/project (contains — or date patterns)
    const hasDash = t.includes("—") || t.includes("–");
    const hasDate = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|\d{4})\b/i.test(t);
    const isBoldLine = hasDash || hasDate;

    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: t, bold: isBoldLine, size: 20, color: "1e293b" })],
      spacing: { after: 60 },
    }));
    i++;
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: "1e293b" },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
      },
      children: paragraphs,
    }],
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, filename = "resume" } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const doc = buildDocx(content);
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^a-z0-9_-]/gi, "_")}.docx"`,
      "Content-Length": buffer.byteLength.toString(),
    },
  });
}
