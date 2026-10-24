"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { cadastrarLead, type EstadoLead } from "@/app/actions/leads";

const INICIAL: EstadoLead = { ok: false };

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-7 py-3.5 text-sm text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Cadastrando…" : "Quero receber"}
    </button>
  );
}

export function LeadForm({
  origem = "newsletter",
  propertyId,
}: {
  origem?: string;
  propertyId?: string;
}) {
  const [estado, acao] = useActionState(cadastrarLead, INICIAL);

  if (estado.ok) {
    return (
      <p className="text-pretty text-[0.9375rem] leading-relaxed text-fg">
        {estado.mensagem}
      </p>
    );
  }

  return (
    <form action={acao} className="w-full">
      <input type="hidden" name="origem" value={origem} />
      {/* Isca para robôs: fora da tela, fora da ordem de tabulação e sem
          preenchimento automático. Pessoa de verdade nunca toca nisto. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {propertyId ? (
        <input type="hidden" name="property_id" value={propertyId} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="lead-nome" className="sr-only">
            Seu nome
          </label>
          <input
            id="lead-nome"
            name="nome"
            autoComplete="name"
            placeholder="Seu nome"
            aria-invalid={Boolean(estado.erros?.nome)}
            className="w-full border-b border-border-strong bg-transparent py-3 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          {estado.erros?.nome ? (
            <p className="mt-2 text-xs text-fg-muted">{estado.erros.nome}</p>
          ) : null}
        </div>

        <div className="flex-1">
          <label htmlFor="lead-whatsapp" className="sr-only">
            Seu WhatsApp com DDD
          </label>
          <input
            id="lead-whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="WhatsApp com DDD"
            aria-invalid={Boolean(estado.erros?.whatsapp)}
            className="numeros w-full border-b border-border-strong bg-transparent py-3 text-[0.9375rem] placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
          {estado.erros?.whatsapp ? (
            <p className="mt-2 text-xs text-fg-muted">{estado.erros.whatsapp}</p>
          ) : null}
        </div>

        <Botao />
      </div>

      {estado.mensagem ? (
        <p className="mt-3 text-sm text-fg-muted">{estado.mensagem}</p>
      ) : null}
    </form>
  );
}
