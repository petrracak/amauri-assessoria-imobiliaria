import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import Script from "next/script";

import { ServiceWorker } from "@/components/service-worker";
import { ThemeProvider } from "@/components/theme-provider";
import { ehEnderecoTemporario, siteUrl } from "@/lib/site";

import "./globals.css";

/**
 * Uma família para tudo: grotesca contemporânea, de traço fechado e formas
 * neutras. Nos títulos ela é usada grande e com espaçamento apertado — é
 * assim que ela ganha porte — e na interface, no tamanho normal.
 */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans-base",
  display: "swap",
});

/**
 * A assinatura da casa: uma serifada de contraste alto, em itálico, usada só
 * nas duas ou três palavras que carregam a ideia do título. É o que tira o
 * título do lugar-comum sem precisar de enfeite.
 */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-destaque-base",
  display: "swap",
});

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
  robots: ehEnderecoTemporario
    ? { index: false, follow: false }
    : { index: true, follow: true },
  icons: {
    icon: "/icone-192.png",
    // O iOS ignora o manifesto para o ícone da tela inicial.
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Amauri",
    statusBarStyle: "default",
  },
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
      className={`${geist.variable} ${instrument.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
        <ServiceWorker />

        {/* Precisa rodar antes da hidratação: quem já viu a abertura nesta
            sessão não chega a enxergar um piscar dela. Um <script> cru na
            árvore do React não executa e ainda quebra a hidratação — por
            isso next/script com beforeInteractive. */}
        <Script id="intro-visto" strategy="beforeInteractive">
          {`try{if(sessionStorage.getItem('amauri:intro'))document.documentElement.dataset.intro='visto'}catch(e){}`}
        </Script>
      </body>
    </html>
  );
}
