import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "../components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Proxoria — One API for Claude, GPT-4, and Gemini",
    template: "%s — Proxoria",
  },
  description:
    "Unified control plane for enterprise LLMs. Route to Claude, GPT-4, and Gemini with cost tracking, budget controls, and team access management.",
  keywords: ["AI gateway", "LLM API", "Claude API", "GPT-4 API", "Gemini API", "AI cost management", "enterprise AI"],
  openGraph: {
    title: "Proxoria — One API for Claude, GPT-4, and Gemini",
    description:
      "Unified control plane for enterprise LLMs. Route to Claude, GPT-4, and Gemini with cost tracking, budget controls, and team access management.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proxoria — One API for Claude, GPT-4, and Gemini",
    description:
      "Unified control plane for enterprise LLMs. Route to Claude, GPT-4, and Gemini with cost tracking, budget controls, and team access management.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
