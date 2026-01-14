import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Surfaced - Shopify App",
  description: "A powerful Shopify app built with Next.js, Prisma, and Polaris.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Surfaced - Shopify App",
    description: "A powerful Shopify app built with Next.js, Prisma, and Polaris.",
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
        {/* Shopify App Bridge API Key - required for embedded apps */}
        <meta name="shopify-api-key" content={apiKey} />
        {/* Preload App Bridge for faster initialization */}
        <link
          rel="preload"
          href="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          as="script"
        />
        {/* Shopify App Bridge 4.x - loaded from Shopify CDN (required) */}
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          strategy="beforeInteractive"
        />
        {/* Web Vitals debug mode for development */}
        {process.env.NODE_ENV === "development" && (
          <meta name="shopify-debug" content="web-vitals" />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
