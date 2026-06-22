import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import clsx from "clsx";

const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "SESAM Explorer - Analyse de Télétransmission",
  description: "Dashboard premium pour l'exploration des données de télétransmission SESAM-Vitale.",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Prevent zoom on inputs on mobile
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SESAM Explorer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={clsx(outfit.className, "bg-gray-50 min-h-screen antialiased")}>
        {children}
      </body>
    </html>
  );
}
