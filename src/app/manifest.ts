import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zim Diaspora Tutoring",
    short_name: "ZDT",
    description: "Connecting learners and educators globally",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#064e3b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
