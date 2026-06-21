import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Tipografia serifada (DESIGN.md §3) — expõe as CSS vars usadas no Tailwind.
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karmaleões — Painel Administrativo",
  description: "Plataforma administrativa do ecossistema Karmaleões.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${mono.variable}`}>
      <body className="font-serif antialiased">{children}</body>
    </html>
  );
}
