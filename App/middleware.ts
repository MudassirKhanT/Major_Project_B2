import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { aj } from "@/lib/arcjet";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/clerk(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Run Arcjet on API routes only if key is configured
  if (aj && req.nextUrl.pathname.startsWith("/api/")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decision = await (aj as any).protect(req);
    if (decision.isDenied()) {
      if (decision.reason.isBot())
        return NextResponse.json({ error: "Bot detected" }, { status: 403 });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
