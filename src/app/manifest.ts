import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vest AI - Smart Investment Platform",
    short_name: "Vest AI",
    description:
      "Platform analisis saham berbasis AI untuk keputusan investasi cerdas",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#3b82f6",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["finance", "investment", "productivity", "trackers"],
    lang: "id",
    dir: "ltr",
  };
}
