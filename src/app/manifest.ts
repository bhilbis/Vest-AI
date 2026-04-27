import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "vest-ai-finance",
    name: "Financial Tracker — Minimalist",
    short_name: "Finance",
    description:
      "Aplikasi pencatat keuangan minimalis untuk melacak pengeluaran, pemasukan, transfer, dan budget secara cepat dan aman.",
    start_url: "/financial-overview",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#09090B",
    orientation: "portrait",
    icons: [
      {
        src: "/vest.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/vest.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/vest.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/vest.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["finance", "productivity", "trackers"],
    lang: "id",
    dir: "ltr",
    screenshots: [
      {
        src: "/vest.png",
        sizes: "1200x630",
        type: "image/png",
        label: "Dashboard Financial Tracker",
      },
    ],
  };
}
