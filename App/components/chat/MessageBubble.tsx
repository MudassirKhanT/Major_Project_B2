"use client";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-xs shrink-0 mt-0.5 mr-2">
          🤖
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-primary-600 text-white rounded-br-md"
            : "bg-dark-800 border border-slate-700 text-slate-200 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div>
            <MarkdownContent content={message.content} />
            {message.streaming && (
              <span className="inline-block w-1.5 h-4 bg-primary-400 ml-1 animate-pulse rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown renderer for code blocks and basic formatting
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim();
          const code = lines.slice(1, -1).join("\n");
          return (
            <div key={i} className="rounded-lg overflow-hidden border border-slate-600">
              {lang && (
                <div className="px-3 py-1 bg-slate-700 text-xs text-slate-400 font-mono">
                  {lang}
                </div>
              )}
              <pre className="p-3 bg-dark-950 overflow-x-auto text-xs text-slate-200 font-mono">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Format bold, headings, bullets
        const formatted = part
          .split("\n")
          .map((line, j) => {
            if (line.startsWith("## "))
              return <h2 key={j} className="font-bold text-white text-base mt-3 mb-1">{line.slice(3)}</h2>;
            if (line.startsWith("# "))
              return <h1 key={j} className="font-bold text-white text-lg mt-3 mb-1">{line.slice(2)}</h1>;
            if (line.startsWith("- ") || line.startsWith("* "))
              return <li key={j} className="ml-4 list-disc text-slate-200">{renderInline(line.slice(2))}</li>;
            if (/^\d+\. /.test(line)) {
              const text = line.replace(/^\d+\. /, "");
              return <li key={j} className="ml-4 list-decimal text-slate-200">{renderInline(text)}</li>;
            }
            if (line === "") return <br key={j} />;
            return <p key={j} className="text-slate-200 leading-relaxed">{renderInline(line)}</p>;
          });

        return <div key={i}>{formatted}</div>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="px-1 py-0.5 bg-slate-700 rounded text-xs font-mono text-primary-300">{p.slice(1, -1)}</code>;
    return p;
  });
}
