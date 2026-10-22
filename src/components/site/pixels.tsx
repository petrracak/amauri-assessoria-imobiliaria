"use client";

import Script from "next/script";

import { useConsentimento } from "@/lib/consentimento";
import type { Pixels as PixelsConfig } from "@/lib/settings";

/** Só o que casa com o formato do provedor entra no HTML. */
const VALIDO = /^[\w-]{1,40}$/;

function limpo(valor?: string) {
  const v = (valor ?? "").trim();
  return v && VALIDO.test(v) ? v : null;
}

/**
 * Carrega os pixels configurados no painel, e só depois do aceite de
 * cookies — é o que a LGPD pede. Tudo com `afterInteractive`: rastreio não
 * pode atrasar a primeira foto do imóvel aparecendo.
 */
export function Pixels({ pixels }: { pixels: PixelsConfig }) {
  const consentimento = useConsentimento();

  if (consentimento !== "aceito") return null;

  const meta = limpo(pixels.meta_pixel_id);
  const ga4 = limpo(pixels.ga4_id);
  const gtm = limpo(pixels.gtm_id);
  const ads = limpo(pixels.google_ads_id);
  const googleTag = ga4 ?? ads;

  return (
    <>
      {gtm ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}

      {googleTag ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTag}`}
            strategy="afterInteractive"
          />
          <Script id="gtag" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
${ga4 ? `gtag('config','${ga4}');` : ""}
${ads ? `gtag('config','${ads}');` : ""}`}
          </Script>
        </>
      ) : null}

      {meta ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${meta}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
