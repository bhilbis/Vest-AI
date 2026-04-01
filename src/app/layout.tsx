import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/layout/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { VestAIStructuredData } from "@/components/seo/JsonLd";
import "katex/dist/katex.min.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#09090B",
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
    default: "Financial Tracker — Minimalist Finance Management",
    template: "%s | Financial Tracker",
  },
  description:
    "Aplikasi pencatat keuangan minimalis untuk melacak pengeluaran, pemasukan, transfer, dan budget. Dilengkapi AI assistant untuk saran keuangan.",
  keywords: [
    "financial tracker",
    "pencatat keuangan",
    "expense tracker",
    "budget planner",
    "pengelolaan keuangan",
    "transfer saldo",
    "AI financial assistant",
    "aplikasi keuangan",
  ],
  authors: [{ name: "Financial Tracker" }],
  creator: "Financial Tracker",
  publisher: "Financial Tracker",
  metadataBase: new URL("https://go-aoixsy.my.id"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://go-aoixsy.my.id",
    siteName: "Financial Tracker",
    title: "Financial Tracker — Minimalist Finance Management",
    description:
      "Aplikasi pencatat keuangan minimalis untuk melacak pengeluaran, pemasukan, transfer, dan budget.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Financial Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Tracker — Minimalist Finance Management",
    description:
      "Pencatat keuangan minimalis dengan AI assistant.",
    images: ["/opengraph-image"],
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
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <VestAIStructuredData />
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  if ('${process.env.NODE_ENV}' === 'production') {
                    window.addEventListener('load', () => {
                      navigator.serviceWorker.register('/sw.js').catch(() => {});
                    });
                  } else {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.unregister();
                      }
                    });
                  }
                }
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
