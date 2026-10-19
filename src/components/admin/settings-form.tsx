"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { salvarConfig, type EstadoConfig } from "@/app/actions/configuracoes";
import type { Contato, Hero, Pixels } from "@/lib/settings";
import { cn } from "@/lib/utils";

const entrada =
  "mt-2 w-full border-b border-border-strong bg-transparent py-2.5 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none";

function Campo({
  nome,
  rotulo,
  dica,
  erro,
  children,
  className,
}: {
  nome: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={nome} className="block text-sm text-fg-muted">
        {rotulo}
      </label>
      {children}
      {dica && !erro ? <p className="mt-1.5 text-xs text-fg-subtle">{dica}</p> : null}
      {erro ? <p className="mt-1.5 text-xs text-fg">{erro}</p> : null}
    </div>
  );
}

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-7 py-3.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar configurações"}
    </button>
  );
}

export function SettingsForm({
  contato,
  hero,
  pixels,
}: {
  contato: Contato;
  hero: Hero;
  pixels: Pixels;
}) {
  const [estado, acao] = useActionState<EstadoConfig, FormData>(salvarConfig, {
    ok: false,
  });
  const erro = (c: string) => estado.erros?.[c];

  return (
    <form action={acao} className="max-w-3xl">
      <fieldset>
        <legend className="font-display text-2xl">Contato</legend>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Campo
            nome="whatsapp"
            rotulo="WhatsApp"
            dica="Com código do país e DDD: 5593991953656"
            erro={erro("whatsapp")}
          >
            <input
              id="whatsapp"
              name="whatsapp"
              inputMode="numeric"
              defaultValue={contato.whatsapp}
              className={cn(entrada, "numeros")}
            />
          </Campo>

          <Campo nome="telefone_exibicao" rotulo="Telefone como aparece no site">
            <input
              id="telefone_exibicao"
              name="telefone_exibicao"
              defaultValue={contato.telefone_exibicao}
              className={cn(entrada, "numeros")}
            />
          </Campo>

          <Campo nome="email" rotulo="E-mail" erro={erro("email")}>
            <input id="email" name="email" type="email" defaultValue={contato.email} className={entrada} />
          </Campo>

          <Campo nome="creci" rotulo="CRECI">
            <input id="creci" name="creci" defaultValue={contato.creci} className={entrada} />
          </Campo>

          <Campo
            nome="instagram"
            rotulo="Instagram"
            dica="Link completo, com https://"
            erro={erro("instagram")}
            className="sm:col-span-2"
          >
            <input id="instagram" name="instagram" defaultValue={contato.instagram} className={entrada} />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="mt-14">
        <legend className="font-display text-2xl">Primeira dobra da home</legend>
        <div className="mt-6 grid gap-6">
          <Campo nome="hero_titulo" rotulo="Título" erro={erro("hero_titulo")}>
            <input id="hero_titulo" name="hero_titulo" defaultValue={hero.titulo} className={entrada} />
          </Campo>

          <Campo nome="hero_subtitulo" rotulo="Linha de apoio">
            <input
              id="hero_subtitulo"
              name="hero_subtitulo"
              defaultValue={hero.subtitulo}
              className={entrada}
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="mt-14">
        <legend className="font-display text-2xl">Pixels e rastreio</legend>
        <p className="mt-3 max-w-[56ch] text-pretty text-sm leading-relaxed text-fg-muted">
          Cole só o identificador, não o código inteiro. Quem cuida do tráfego
          consegue mexer aqui sem precisar de programador. Campo vazio desliga.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Campo
            nome="meta_pixel_id"
            rotulo="Meta Pixel"
            dica="Só os números, ex.: 123456789012345"
            erro={erro("meta_pixel_id")}
          >
            <input
              id="meta_pixel_id"
              name="meta_pixel_id"
              defaultValue={pixels.meta_pixel_id ?? ""}
              className={cn(entrada, "numeros")}
            />
          </Campo>

          <Campo nome="ga4_id" rotulo="Google Analytics 4" dica="Começa com G-" erro={erro("ga4_id")}>
            <input id="ga4_id" name="ga4_id" defaultValue={pixels.ga4_id ?? ""} className={entrada} />
          </Campo>

          <Campo nome="gtm_id" rotulo="Google Tag Manager" dica="Começa com GTM-" erro={erro("gtm_id")}>
            <input id="gtm_id" name="gtm_id" defaultValue={pixels.gtm_id ?? ""} className={entrada} />
          </Campo>

          <Campo
            nome="google_ads_id"
            rotulo="Google Ads"
            dica="Começa com AW-"
            erro={erro("google_ads_id")}
          >
            <input
              id="google_ads_id"
              name="google_ads_id"
              defaultValue={pixels.google_ads_id ?? ""}
              className={entrada}
            />
          </Campo>
        </div>
      </fieldset>

      {estado.mensagem ? (
        <p className="mt-8 text-sm text-fg-muted">{estado.mensagem}</p>
      ) : null}

      <div className="mt-10">
        <Salvar />
      </div>
    </form>
  );
}
