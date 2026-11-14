import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import Script from "next/script";

import { ServiceWorker } from "@/components/service-worker";
import { ThemeProvider } from "@/components/theme-provider";
import { ehEnderecoTemporario, siteUrl } from "@/lib/site";

import "./globals.css";

/**
 * Corpo e interface: grotesca humanista, de traço aberto e boa leitura em
 * tela pequena. Troca da DM Sans, que é a fonte de corpo de metade dos
 * sites feitos por gerador.
 */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-base",
  display: "swap",
});

/**
 * Títulos do site: serifada de jornal, desenhada para leitura em tela. Dá ao
 * site o tom de revista de arquitetura, que combina com imóvel de alto
 * padrão, e sai do padrão de títulos em sans expandida.
 *
 * Um peso só, estático: a versão variável com eixo de tamanho óptico pesava
 * 129 KB; esta pesa cerca de um quarto disso e carrega antes do título.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-titulo-base",
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
      className={`${hanken.variable} ${newsreader.variable}`}
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
