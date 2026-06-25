import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/layout/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { VestAIStructuredData } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SplashScreen } from "@/components/pwa/SplashScreen";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { LanguageProvider } from "@/lib/i18n/context";
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
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Vest AI — Catat Keuangan, Investasi & Kuliah",
    template: "%s | Vest AI",
  },
  description:
    "Aplikasi manajemen pribadi all-in-one. Catat pengeluaran & pemasukan, pantau portofolio investasi, kelola jadwal kuliah, dan konsultasi dengan AI assistant. Gratis.",
  keywords: [
    "pencatat keuangan",
    "aplikasi keuangan pribadi",
    "budget planner",
    "portofolio investasi",
    "tracker kuliah",
    "expense tracker",
    "AI financial assistant",
    "manajemen keuangan",
    "academic tracker",
    "vest ai",
  ],
  authors: [{ name: "Vest AI" }],
  creator: "Vest AI",
  publisher: "Vest AI",
  metadataBase: new URL("https://go-aoixsy.my.id"),
  appleWebApp: {
    capable: true,
    // black-translucent lets content extend under the status bar;
    // safe-area-inset-top in globals.css compensates for the notch.
    statusBarStyle: "black-translucent",
    title: "Vest AI",
    startupImage: [
      // iPhone 15 Pro Max / 14 Pro Max (430×932 @3x)
      { url: "/vest.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 15 / 14 / 13 / 12 (390×844 @3x)
      { url: "/vest.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 15 Plus / 14 Plus / 13 Pro Max / 12 Pro Max (428×926 @3x)
      { url: "/vest.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 13 mini / 12 mini (375×812 @3x)
      { url: "/vest.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone 11 / XR (414×896 @2x)
      { url: "/vest.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPhone 11 Pro / X / XS (375×812 @3x — same logical size as mini but different DPR target)
      { url: "/vest.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      // iPhone SE 3rd gen / 8 / 7 / 6 (375×667 @2x)
      { url: "/vest.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPad Pro 12.9" (1024×1366 @2x)
      { url: "/vest.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPad Pro 11" / Air (834×1194 @2x)
      { url: "/vest.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPad mini / Air 9.7" (768×1024 @2x)
      { url: "/vest.png", media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
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
    siteName: "Vest AI",
    title: "Vest AI — Catat Keuangan, Investasi & Kuliah",
    description:
      "Manajemen keuangan, portofolio investasi, dan tracker kuliah dalam satu aplikasi. Dilengkapi AI assistant untuk konsultasi finansial.",
    images: [
      {
        url: "/vest.png",
        width: 1200,
        height: 630,
        alt: "Vest AI — Aplikasi Manajemen Keuangan & Kuliah",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vest AI — Catat Keuangan, Investasi & Kuliah",
    description:
      "All-in-one: catat keuangan, pantau investasi, kelola kuliah, dan chat dengan AI. Gratis.",
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
    google: "cM4VTnnUD5rbwJY7oJ2_rYWqEOwroXBM8-DRdT7C-UY",
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
          <LanguageProvider>
            <SplashScreen />
            <InstallPrompt />
            <VestAIStructuredData />
            <SessionProviderWrapper>
              {children}
              <Toaster position="top-center" richColors />
              <ConfirmDialog />
            </SessionProviderWrapper>
          </LanguageProvider>
        </ThemeProvider>
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
      </body>
    </html>
  );
}
