import type { Metadata, Viewport } from "next";
import { Archivo, Newsreader } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

/** Interface e ficha técnica: numerais tabulares alinham preço e área. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans-base",
  display: "swap",
});

/** Títulos e preços: serifada editorial, com itálico de verdade. */
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display-base",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.amaurinobre.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Amauri Assessoria Imobiliária — Imóveis de alto padrão em Santarém",
    template: "%s | Amauri Assessoria Imobiliária",
  },
  description:
    "Casas, apartamentos e terrenos de alto padrão em Santarém, no Pará. " +
    "Assessoria completa na compra e na venda do seu imóvel.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Amauri Assessoria Imobiliária",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${archivo.variable} ${newsreader.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
