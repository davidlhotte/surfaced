import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Surfaced - AI Visibility Platform | AEO for Every Brand",
  description: "See what ChatGPT, Claude & Perplexity say about your brand. Get discovered by AI assistants and dominate AI search results.",
  keywords: ["AEO", "AI visibility", "ChatGPT SEO", "AI search optimization", "answer engine optimization"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Surfaced - AI Visibility Platform",
    description: "See what ChatGPT, Claude & Perplexity say about your brand.",
    type: "website",
    siteName: "Surfaced",
  },
  twitter: {
    card: "summary_large_image",
    title: "Surfaced - AI Visibility Platform",
    description: "See what ChatGPT, Claude & Perplexity say about your brand.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Marketing layout - NO Shopify App Bridge
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
        <MarketingHeader />
        <main className="pt-16">{children}</main>
        <MarketingFooter />
      </body>
    </html>
  );
}
