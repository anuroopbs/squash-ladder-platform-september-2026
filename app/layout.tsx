import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Ladder — find your local racket sports ladder",
  description:
    "Find your city, find your club, join the ladder. Squash, padel, and racquetball ladders for players everywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0f0d] font-sans text-white antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
