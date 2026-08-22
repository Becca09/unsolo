import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unsolo",
    short_name: "Unsolo",
    description: "Unsolo — international travel marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#E4E9DD",
    theme_color: "#1F2F10",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
