"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { salvarConfig, type EstadoConfig } from "@/app/actions/configuracoes";
import type { Contato, Hero, Pixels } from "@/lib/settings";
import { BarraSalvar, Campo, Cartao, botao, campo } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(botao.primario, "flex-1 sm:flex-none")}>
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
    <form action={acao} className="space-y-4">
      <Cartao titulo="Contato" descricao="Aparece no rodapé, no botão de WhatsApp e nos anúncios.">
        <div className="grid gap-5 sm:grid-cols-2">
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
              className={cn(campo, "numeros")}
            />
          </Campo>

          <Campo nome="telefone_exibicao" rotulo="Telefone como aparece no site">
            <input
              id="telefone_exibicao"
              name="telefone_exibicao"
              defaultValue={contato.telefone_exibicao}
              className={cn(campo, "numeros")}
            />
          </Campo>

          <Campo nome="email" rotulo="E-mail" erro={erro("email")}>
            <input id="email" name="email" type="email" defaultValue={contato.email} className={campo} />
          </Campo>

          <Campo nome="creci" rotulo="CRECI">
            <input id="creci" name="creci" defaultValue={contato.creci} className={campo} />
          </Campo>

          <Campo
            nome="instagram"
            rotulo="Instagram"
            dica="Link completo, com https://"
            erro={erro("instagram")}
            className="sm:col-span-2"
          >
            <input id="instagram" name="instagram" defaultValue={contato.instagram} className={campo} />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Primeira dobra da home" descricao="O que aparece sobre a foto do Amauri, assim que o site abre.">
        <div className="grid gap-5">
          <Campo nome="hero_titulo" rotulo="Título" erro={erro("hero_titulo")}>
            <input id="hero_titulo" name="hero_titulo" defaultValue={hero.titulo} className={campo} />
          </Campo>

          <Campo nome="hero_subtitulo" rotulo="Linha de apoio">
            <input
              id="hero_subtitulo"
              name="hero_subtitulo"
              defaultValue={hero.subtitulo}
              className={campo}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao
        titulo="Pixels e rastreio"
        descricao="Cole só o identificador, não o código inteiro. Quem cuida do tráfego mexe aqui sem programador. Campo vazio desliga."
      >
        <div className="grid gap-5 sm:grid-cols-2">
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
              className={cn(campo, "numeros")}
            />
          </Campo>

          <Campo nome="ga4_id" rotulo="Google Analytics 4" dica="Começa com G-" erro={erro("ga4_id")}>
            <input id="ga4_id" name="ga4_id" defaultValue={pixels.ga4_id ?? ""} className={campo} />
          </Campo>

          <Campo nome="gtm_id" rotulo="Google Tag Manager" dica="Começa com GTM-" erro={erro("gtm_id")}>
            <input id="gtm_id" name="gtm_id" defaultValue={pixels.gtm_id ?? ""} className={campo} />
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
              className={campo}
            />
          </Campo>
        </div>
      </Cartao>

      <BarraSalvar
        mensagem={estado.mensagem ?? (estado.erros ? "Confira os campos marcados em vermelho." : undefined)}
        tom={estado.ok ? "sucesso" : estado.mensagem || estado.erros ? "erro" : "neutro"}
      >
        <Salvar />
      </BarraSalvar>
    </form>
  );
}
