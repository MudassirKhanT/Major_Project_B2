import { NextRequest, NextResponse } from "next/server";

// Proxy ALL Clerk JS bundle files (main + dynamic chunks) from the CDN server-side.
// This bypasses corporate SSL because NODE_TLS_REJECT_UNAUTHORIZED=0 is set in npm run dev.
// Browser only ever hits http://localhost:3000/clerk/... — no external SSL needed.
//
// Clerk CDN base:  https://endless-fly-11.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/
// clerkJSUrl:      /clerk/clerk.browser.js
// Chunks auto-load from same dir: /clerk/framework_clerk.browser_*.js  etc.

const CDN_BASE =
  "https://endless-fly-11.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist";

// In-memory cache: filename → { content, timestamp }
const cache = new Map<string, { content: string; ts: number }>();
const CACHE_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filename = params.path.join("/");
  const now = Date.now();

  const hit = cache.get(filename);
  if (hit && now - hit.ts < CACHE_MS) {
    return new NextResponse(hit.content, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  try {
    const url = `${CDN_BASE}/${filename}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`[clerk-proxy] CDN returned ${res.status} for ${url}`);
      return new NextResponse(`// CDN error ${res.status}`, {
        status: res.status,
        headers: { "Content-Type": "application/javascript" },
      });
    }

    const content = await res.text();
    cache.set(filename, { content, ts: now });

    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error(`[clerk-proxy] Failed to fetch ${filename}:`, err);
    return new NextResponse(`// Failed to load ${filename}`, {
      status: 503,
      headers: { "Content-Type": "application/javascript" },
    });
  }
}
