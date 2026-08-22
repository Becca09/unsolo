import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unsolo",
  description: "Unsolo — international travel marketplace.",
};

export const viewport: Viewport = {
  themeColor: "#1F2F10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
