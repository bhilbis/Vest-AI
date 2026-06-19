import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "vest-ai-finance",
    name: "Financial Tracker — Minimalist",
    short_name: "Finance",
    description:
      "A minimalist finance tracker to log expenses, income, transfers, and budgets — fast and secure.",
    start_url: "/financial-overview",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#09090B",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    categories: ["finance", "productivity"],
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
    screenshots: [
      // Mobile (narrow) — Chrome/Android requires form_factor for install eligibility
      {
        src: "/vest.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Financial Overview",
      },
      {
        src: "/vest.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Financial Tracker Dashboard",
      },
    ],
  };
}
