import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Surfaced - Shopify App",
  description: "AI Visibility tracking for Shopify stores.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Surfaced - Shopify App",
    description: "AI Visibility tracking for Shopify stores.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';

  return (
    <html lang="en">
      <head>
        {/* Shopify App Bridge API Key - MUST be before app-bridge.js */}
        <meta name="shopify-api-key" content={apiKey} />
        {/*
          CRITICAL: Shopify App Bridge MUST be loaded synchronously
          - No async, no defer, no type=module
          - Must be first script tag
          Using dangerouslySetInnerHTML to avoid Next.js adding async
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: '',
          }}
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
