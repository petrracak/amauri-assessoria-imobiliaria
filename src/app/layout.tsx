import type { Metadata, Viewport } from "next";
import { Archivo, DM_Sans } from "next/font/google";
import Script from "next/script";

import { ServiceWorker } from "@/components/service-worker";
import { ThemeProvider } from "@/components/theme-provider";
import { ehEnderecoTemporario, siteUrl } from "@/lib/site";

import "./globals.css";

/** Corpo e interface: desenhada para ritmo de leitura em tela. */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-base",
  display: "swap",
});

/**
 * Títulos: grotesca com eixo de largura. Usada expandida, ela tem porte
 * arquitetônico — vocabulário de incorporadora, não de blog.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display-base",
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
      className={`${dmSans.variable} ${archivo.variable}`}
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
