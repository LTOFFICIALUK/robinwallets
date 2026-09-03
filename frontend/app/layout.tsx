import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TrackerProvider } from "@/components/TrackerProvider";
import { BRAND, TAGLINE } from "@/lib/brand";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND} · Robinhood Chain wallet tracker`,
    template: `%s · ${BRAND}`,
  },
  description: TAGLINE,
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${sans.variable} ${mono.variable}`}>
      <body className={`${sans.className} flex min-h-full flex-col antialiased`}>
        <TrackerProvider>
          <a
            href="/#board"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-black"
          >
            Skip to live board
          </a>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </TrackerProvider>
      </body>
    </html>
  );
}
