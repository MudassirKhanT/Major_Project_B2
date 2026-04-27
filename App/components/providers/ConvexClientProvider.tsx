"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

// In development: serve Clerk JS through local proxy to bypass corporate SSL
// In production (Vercel/cloud): Clerk JS loads normally from CDN — no proxy needed
const clerkJSUrl =
  process.env.NODE_ENV === "development" ? "/clerk/clerk.browser.js" : undefined;

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider clerkJSUrl={clerkJSUrl}>
      {children}
    </ClerkProvider>
  );
}
