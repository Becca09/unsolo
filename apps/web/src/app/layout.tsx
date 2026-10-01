import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Unsolo — Travel the world, never alone",
  description:
    "UNSOLO connects you with real people who want to go where you want to go. Find your travel crew, plan together, and make memories that actually last.",
  openGraph: {
    title: "Unsolo — Travel the world, never alone",
    description: "Join curated trips, build your own, and explore the world together with Unsolo.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F6F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable}`}>
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
