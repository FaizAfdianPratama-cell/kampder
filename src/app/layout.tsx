// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Roboto, Poppins, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import OneSignalInit from "@/components/OneSignalInit";

const roboto   = Roboto({ subsets: ["latin"], weight: ["300","400","500","700","900"], variable: "--font-roboto" });
const poppins  = Poppins({ subsets: ["latin"], weight: ["300","400","500","600","700","800","900"], variable: "--font-poppins" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400","500","600","700","800","900"], variable: "--font-playfair" });
const inter    = Inter({ subsets: ["latin"], weight: ["300","400","500","600","700","800","900"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Kampder — Kampus Coder",
  description: "Teman setia mahasiswa. Catat tugas, cek kalender, dan atur uang kuliah di satu tempat",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Kampder" },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-theme="dark"
      data-scroll-behavior="smooth"
      className={`${roboto.variable} ${poppins.variable} ${playfair.variable} ${inter.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ fontFamily: "var(--font-roboto), sans-serif" }}>
        <Providers>
          <OneSignalInit />
          {children}
        </Providers>
      </body>
    </html>
  );
}
