import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Luce AI — Automazione intelligente per PMI italiane",
  description:
    "Portiamo chiarezza nei processi aziendali. AI, automazione e software su misura per piccole e medie imprese italiane. Osserviamo, diagnostichiamo, costruiamo insieme.",
  keywords: [
    "AI",
    "automazione",
    "PMI",
    "software",
    "Italia",
    "intelligenza artificiale",
    "digital transformation",
    "consulenza digitale",
  ],
  authors: [{ name: "Luce AI" }],
  openGraph: {
    title: "Luce AI — Automazione intelligente per PMI italiane",
    description:
      "Portiamo chiarezza nei processi aziendali. AI, automazione e software su misura per PMI.",
    type: "website",
    locale: "it_IT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased cursor-none">
        {children}
      </body>
    </html>
  );
}
