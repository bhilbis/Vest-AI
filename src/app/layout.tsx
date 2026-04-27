import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/layout/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { VestAIStructuredData } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import "katex/dist/katex.min.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#09090B",
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Financial Tracker",
    startupImage: [
      {
        url: "/vest.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/vest.png",
    shortcut: "/vest.png",
    apple: "/vest.png",
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
        url: "/vest.png",
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
    images: ["/vest.png"],
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
        className={`${jakarta.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SplashScreen />
          <VestAIStructuredData />
          <SessionProviderWrapper>
            {children}
            <Toaster position="top-center" richColors />
          </SessionProviderWrapper>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    }, function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
