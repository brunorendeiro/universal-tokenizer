import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universal Tokenizer",
  description:
    "Inspect tokens, compare model efficiency, and forecast AI costs locally in your browser — no API key required.",
  applicationName: "Universal Tokenizer",
  creator: "Bruno Rendeiro",
  keywords: [
    "AI tokenizer",
    "token counter",
    "LLM cost calculator",
    "GPT tokens",
    "Claude tokens",
    "local AI tools",
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "Universal Tokenizer",
    description:
      "Inspect how AI models read your prompt and forecast token costs — privately in your browser.",
    siteName: "Universal Tokenizer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Universal Tokenizer",
    description:
      "Inspect how AI models read your prompt and forecast token costs — privately in your browser.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
