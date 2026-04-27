import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/ConvexClientProvider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentify — AI Agent Builder Platform",
  description: "Build, deploy, and manage intelligent AI agents with ease.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-950 text-white antialiased`}>
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: { background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" },
          }}
        />
      </body>
    </html>
  );
}
