import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/layout/session-provider";
import "katex/dist/katex.min.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Vest AI - AI-Powered Stock Analysis & Investment Tools",
    template: "%s | Vest AI",
  },
  description:
    "Vest AI - Platform analisis saham berbasis AI yang membantu investor membuat keputusan investasi cerdas dengan teknologi machine learning dan real-time market data.",
  keywords: [
    "vest ai",
    "stock analysis",
    "investment tools",
    "AI trading",
    "saham indonesia",
    "analisis saham",
    "investasi cerdas",
    "portfolio tracker",
    "market analysis",
    "teknologi investasi",
  ],
  authors: [{ name: "Vest AI Team" }],
  creator: "Vest AI",
  publisher: "Vest AI",
  metadataBase: new URL("https://go-aoixsy.my.id"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://go-aoixsy.my.id",
    siteName: "Vest AI",
    title: "Vest AI - AI-Powered Stock Analysis & Investment Tools",
    description:
      "Platform analisis saham berbasis AI yang membantu investor membuat keputusan investasi cerdas dengan teknologi machine learning dan real-time market data.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vest AI - Smart Investment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vest AI - AI-Powered Stock Analysis & Investment Tools",
    description:
      "Platform analisis saham berbasis AI yang membantu investor membuat keputusan investasi cerdas.",
    images: ["/opengraph-image"],
    creator: "@vestai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual code from Google Search Console
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} transform transition-transform duration-300 ease-in-out`}
      >
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
