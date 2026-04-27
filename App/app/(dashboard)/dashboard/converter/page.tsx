"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

type ConversionState = "idle" | "converting" | "done" | "error";

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ConversionState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ".pdf,.docx";
  const isPdf = file?.name.toLowerCase().endsWith(".pdf");
  const isDocx = file?.name.toLowerCase().endsWith(".docx");
  const direction = isPdf ? "PDF → Word (.docx)" : isDocx ? "Word → PDF" : null;
  const outputExt = isPdf ? ".docx" : ".pdf";

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  function pickFile(f: File) {
    const n = f.name.toLowerCase();
    if (!n.endsWith(".pdf") && !n.endsWith(".docx")) {
      toast.error("Only .pdf and .docx files are supported");
      return;
    }
    setFile(f);
    setState("idle");
  }

  async function convert() {
    if (!file) return;
    setState("converting");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/convert", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Conversion failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^.]+$/, outputExt);
      a.click();
      URL.revokeObjectURL(url);

      setState("done");
      toast.success("File converted and downloaded!");
    } catch (err) {
      setState("error");
      toast.error(err instanceof Error ? err.message : "Conversion failed");
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">File Converter</h1>
        <p className="text-slate-400 text-sm">Convert between PDF and Word (.docx) formats instantly</p>
      </div>

      {/* Supported conversions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { from: "📄 PDF", to: "📝 Word (.docx)", desc: "Extract text from PDF into an editable document" },
          { from: "📝 Word (.docx)", to: "📄 PDF", desc: "Convert Word document to a shareable PDF" },
        ].map((c) => (
          <div key={c.from} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-white text-sm font-medium">{c.from} → {c.to}</p>
            <p className="text-slate-500 text-xs mt-1">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          dragOver
            ? "border-indigo-500 bg-indigo-500/10"
            : file
            ? "border-green-500/50 bg-green-500/5"
            : "border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-900"
        }`}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />

        {file ? (
          <div className="space-y-2">
            <p className="text-4xl">{isPdf ? "📄" : "📝"}</p>
            <p className="text-white font-semibold">{file.name}</p>
            <p className="text-slate-400 text-sm">
              {(file.size / 1024).toFixed(1)} KB · Will convert to <span className="text-indigo-400">{direction}</span>
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setState("idle"); }}
              className="text-xs text-slate-500 hover:text-slate-300 mt-1"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-4xl">📂</p>
            <p className="text-white font-medium">Drop your file here</p>
            <p className="text-slate-500 text-sm">or click to browse · .pdf or .docx</p>
          </div>
        )}
      </div>

      {/* Convert button */}
      {file && (
        <button
          onClick={convert}
          disabled={state === "converting"}
          className="mt-6 w-full py-3.5 rounded-xl font-semibold text-sm transition-all
            bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2"
        >
          {state === "converting" ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Converting…</>
          ) : state === "done" ? (
            <><span>✅</span> Convert Another</>
          ) : (
            <><span>⚡</span> Convert {direction}</>
          )}
        </button>
      )}

      {/* Note */}
      <p className="mt-6 text-xs text-slate-600 text-center">
        Files are processed on the server and never stored. Complex layouts may lose some formatting.
      </p>
    </div>
  );
}
