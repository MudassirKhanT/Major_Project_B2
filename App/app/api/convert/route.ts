import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

async function pdfToDocx(buffer: Buffer): Promise<Buffer> {
  // pdf-parse has a webpack quirk — import the inner module directly
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (b: Buffer) => Promise<{ text: string }>;
  const { Document, Packer, Paragraph, TextRun, BorderStyle } = await import("docx");

  const { text } = await pdfParse(buffer);
  const lines = text.split("\n").map((l: string) => l.trim());

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  let nameAdded = false;

  for (const line of lines) {
    if (!line) { paragraphs.push(new Paragraph({ children: [] })); continue; }

    // First meaningful line = treat as name/title
    if (!nameAdded && line.length > 2) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 36 })],
      }));
      nameAdded = true;
      continue;
    }

    // ALL CAPS = section header
    if (line === line.toUpperCase() && line.length > 3 && /[A-Z]/.test(line)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 24, color: "1e40af" })],
        spacing: { before: 200, after: 80 },
        border: { bottom: { color: "93c5fd", size: 4, style: BorderStyle.SINGLE } },
      }));
      continue;
    }

    // Bullet
    if (/^[•\-–]/.test(line)) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line.replace(/^[•\-–]\s*/, ""), size: 20 })],
        bullet: { level: 0 },
        indent: { left: 360 },
      }));
      continue;
    }

    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: line, size: 20 })],
      spacing: { after: 60 },
    }));
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: paragraphs,
    }],
  });

  return Packer.toBuffer(doc);
}

async function docxToPdf(buffer: Buffer): Promise<Buffer> {
  const mammoth = (await import("mammoth")).default;
  const PDFDocument = (await import("pdfkit")).default;

  const { value: html } = await mammoth.convertToHtml({ buffer });
  // Strip HTML tags for plain-text PDF rendering
  const text = html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1\n" + "─".repeat(40) + "\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const lines = text.split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (!t) { doc.moveDown(0.4); continue; }

      if (t.endsWith("─".repeat(10)) || /^─+$/.test(t)) continue; // skip rule lines, we draw them

      // Section header (followed by a rule line pattern)
      const isHeader = t === t.toUpperCase() && t.length > 3 && /[A-Z]/.test(t);
      if (isHeader) {
        doc.moveDown(0.6).font("Helvetica-Bold").fontSize(12).fillColor("#1e40af").text(t);
        doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke("#93c5fd");
        doc.moveDown(0.3).font("Helvetica").fontSize(10).fillColor("#1e293b");
        continue;
      }

      if (t.startsWith("• ")) {
        doc.font("Helvetica").fontSize(10).fillColor("#1e293b").text(t, { indent: 15 });
        continue;
      }

      const bold = t.includes("—") || /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|\d{4})\b/i.test(t);
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor("#1e293b").text(t);
    }

    doc.end();
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf");
  const isDocx = name.endsWith(".docx");

  if (!isPdf && !isDocx) {
    return NextResponse.json({ error: "Only .pdf and .docx files are supported" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  try {
    if (isPdf) {
      const docxBuffer = await pdfToDocx(inputBuffer);
      const outName = name.replace(".pdf", ".docx");
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${outName}"`,
        },
      });
    } else {
      const pdfBuffer = await docxToPdf(inputBuffer);
      const outName = name.replace(".docx", ".pdf");
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${outName}"`,
        },
      });
    }
  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json({ error: "Conversion failed: " + (err instanceof Error ? err.message : "Unknown") }, { status: 500 });
  }
}
