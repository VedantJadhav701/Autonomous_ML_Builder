import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autonomous ML Builder — Production ML Platform",
  description:
    "Production-grade ML lifecycle system with drift detection, SHAP explainability, and adaptive pipeline design.",
};

import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-[#0a0a0a] text-white antialiased min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
