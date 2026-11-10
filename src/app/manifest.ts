import type { MetadataRoute } from "next";

/** Lets people add MindGuide AI to their home screen (needed on iPhone for alerts). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindGuide AI",
    short_name: "MindGuide",
    description: "Private video and voice sessions with verified therapists, from anywhere in Nigeria.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b33a6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
