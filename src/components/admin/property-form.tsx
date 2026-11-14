"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import { salvarImovel, type EstadoImovel } from "@/app/actions/imoveis";
import {
  BarraSalvar,
  Campo,
  Cartao,
  Interruptor,
  Segmentos,
  botao,
  campo,
} from "@/components/admin/ui";
import { SeletorFotos } from "@/components/admin/seletor-fotos";
import { enviarFotos } from "@/lib/enviar-fotos";
import { cn } from "@/lib/utils";

const TIPOS = [
  "Apartamento",
  "Apartamento Duplex",
  "Casa",
  "Casa em Condomínio",
  "Terreno",
  "Terreno em Condomínio",
  "Sala Comercial",
];

export type ImovelForm = {
  id?: string;
  titulo?: string;
  tipo?: string;
  status?: string;
  bairro?: string | null;
  cidade?: string;
  endereco?: string | null;
  mapa_url?: string | null;
  descricao?: string | null;
  badge?: string | null;
  preco?: number | null;
  preco_anterior?: number | null;
  dormitorios?: number | null;
  suites?: number | null;
  banheiros?: number | null;
  vagas?: number | null;
  area_total?: number | null;
  area_privativa?: number | null;
  destaque?: boolean;
  alto_padrao?: boolean;
};

const NUMEROS = [
  { nome: "dormitorios", rotulo: "Dormitórios" },
  { nome: "suites", rotulo: "Suítes" },
  { nome: "banheiros", rotulo: "Banheiros" },
  { nome: "vagas", rotulo: "Vagas" },
  { nome: "area_privativa", rotulo: "Área privativa (m²)" },
  { nome: "area_total", rotulo: "Área total (m²)" },
] as const;

function Salvar({ novo, pendente, enviando }: { novo: boolean; pendente: boolean; enviando: boolean }) {
  return (
    <button type="submit" disabled={pendente} className={cn(botao.primario, "flex-1 sm:flex-none")}>
      {enviando ? "Enviando fotos…" : pendente ? "Salvando…" : novo ? "Cadastrar imóvel" : "Salvar alterações"}
    </button>
  );
}

export function PropertyForm({ imovel }: { imovel?: ImovelForm }) {
  const novo = !imovel?.id;
  const router = useRouter();

  // As fotos escolhidas ficam num ref: a ação abaixo roda depois do envio e
  // precisa da lista mais recente, não da que existia quando ela foi criada.
  const fotos = useRef<File[]>([]);
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null);
  const [, iniciar] = useTransition();

  const [estado, acao, pendente] = useActionState<EstadoImovel, FormData>(
    async (anterior, dados) => {
      const resultado = await salvarImovel(anterior, dados);

      // Imóvel novo: com o cadastro salvo já existe id e referência, então as
      // fotos escolhidas sobem logo em seguida, na mesma tela.
      if (!resultado.ok || !novo || !resultado.id || !resultado.ref || fotos.current.length === 0) {
        return resultado;
      }

      const envio = await enviarFotos({
        propertyId: resultado.id,
        refImovel: resultado.ref,
        arquivos: fotos.current,
        aoProgresso: (feitas, total) => setProgresso({ feitas, total }),
      });
      setProgresso(null);

      return envio.erro
        ? { ...resultado, mensagem: `Imóvel cadastrado, mas nem todas as fotos subiram: ${envio.erro} Complete na aba Fotos.` }
        : resultado;
    },
    { ok: false },
  );

  // Envio manual, e não <form action>: o React 19 limpa todos os campos de um
  // formulário com action quando ele termina — inclusive quando falha. Um link
  // de mapa inválido apagaria o cadastro inteiro.
  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    iniciar(() => acao(dados));
  }

  // Depois de cadastrar, segue para a edição — é lá que entram as fotos.
  useEffect(() => {
    if (estado.ok && novo && estado.id) {
      router.replace(`/admin/imoveis/${estado.id}`);
    }
  }, [estado, novo, router]);

  const erro = (c: string) => estado.erros?.[c];

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
      {imovel?.id ? <input type="hidden" name="id" value={imovel.id} /> : null}

      {novo ? (
        <SeletorFotos
          aoMudar={(arquivos) => {
            fotos.current = arquivos;
          }}
          progresso={progresso}
          travado={pendente}
        />
      ) : null}

      <Cartao titulo="Anúncio">
        <div className="grid gap-5">
          <Campo nome="titulo" rotulo="Título" erro={erro("titulo")}>
            <input
              id="titulo"
              name="titulo"
              required
              defaultValue={imovel?.titulo}
              placeholder="Apartamento no Edifício Orion Palace"
              className={campo}
            />
          </Campo>

          <Campo nome="tipo" rotulo="Tipo" erro={erro("tipo")}>
            <select id="tipo" name="tipo" defaultValue={imovel?.tipo ?? "Apartamento"} className={campo}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Campo>

          <div>
            <span className="block text-sm font-medium">Situação</span>
            <Segmentos
              nome="status"
              valor={imovel?.status ?? "rascunho"}
              opcoes={[
                { valor: "rascunho", rotulo: "Rascunho" },
                { valor: "publicado", rotulo: "No ar" },
                { valor: "arquivado", rotulo: "Arquivado" },
              ]}
            />
            <p className="mt-1.5 text-xs text-fg-muted">
              Rascunho e arquivado não aparecem no site.
            </p>
          </div>
        </div>
      </Cartao>

      <Cartao titulo="Localização">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo nome="bairro" rotulo="Bairro">
            <input id="bairro" name="bairro" defaultValue={imovel?.bairro ?? ""} className={campo} />
          </Campo>

          <Campo nome="cidade" rotulo="Cidade">
            <input id="cidade" name="cidade" defaultValue={imovel?.cidade ?? "Santarém"} className={campo} />
          </Campo>

          <Campo
            nome="endereco"
            rotulo="Endereço"
            dica="Deixe vazio para não mostrar o endereço no site."
            className="sm:col-span-2"
          >
            <input id="endereco" name="endereco" defaultValue={imovel?.endereco ?? ""} className={campo} />
          </Campo>

          <Campo
            nome="mapa_url"
            rotulo="Link do Google Maps"
            dica="No Google Maps, abra o imóvel, toque em Compartilhar e copie o link. O mapa aparece na página do imóvel, junto com o endereço."
            erro={erro("mapa_url")}
            className="sm:col-span-2"
          >
            <input
              id="mapa_url"
              name="mapa_url"
              inputMode="url"
              autoComplete="off"
              defaultValue={imovel?.mapa_url ?? ""}
              placeholder="https://maps.app.goo.gl/..."
              className={campo}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Valores">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo nome="preco" rotulo="Preço (R$)" erro={erro("preco")}>
            <input
              id="preco"
              name="preco"
              inputMode="decimal"
              defaultValue={imovel?.preco ?? ""}
              placeholder="750000"
              className={cn(campo, "numeros")}
            />
          </Campo>

          <Campo
            nome="preco_anterior"
            rotulo="Preço anterior (R$)"
            dica="Aparece riscado, para mostrar desconto."
          >
            <input
              id="preco_anterior"
              name="preco_anterior"
              inputMode="decimal"
              defaultValue={imovel?.preco_anterior ?? ""}
              className={cn(campo, "numeros")}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Características">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {NUMEROS.map((n) => (
            <Campo key={n.nome} nome={n.nome} rotulo={n.rotulo}>
              <input
                id={n.nome}
                name={n.nome}
                inputMode="decimal"
                defaultValue={(imovel?.[n.nome] as number | null | undefined) ?? ""}
                className={cn(campo, "numeros")}
              />
            </Campo>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="Descrição">
        <Campo
          nome="descricao"
          rotulo="Texto do anúncio"
          dica="Uma linha em branco separa parágrafos no site."
        >
          <textarea
            id="descricao"
            name="descricao"
            rows={9}
            defaultValue={imovel?.descricao ?? ""}
            className={cn(campo, "resize-y leading-relaxed")}
          />
        </Campo>
      </Cartao>

      <Cartao titulo="Destaques">
        <div className="divide-y divide-border-base">
          <Interruptor
            nome="destaque"
            titulo="Mostrar na home"
            descricao="Entra na vitrine da primeira página."
            marcado={imovel?.destaque}
          />
          <Interruptor
            nome="alto_padrao"
            titulo="Alto padrão"
            descricao="Marca o imóvel como alto padrão nos filtros."
            marcado={imovel?.alto_padrao}
          />
        </div>

        <Campo
          nome="badge"
          rotulo="Selo sobre a foto"
          dica="Ex.: Últimas unidades. Vazio não mostra nada."
          className="mt-4"
        >
          <input id="badge" name="badge" defaultValue={imovel?.badge ?? ""} className={campo} />
        </Campo>
      </Cartao>

      <BarraSalvar
        mensagem={estado.mensagem ?? (estado.erros ? "Confira os campos marcados em vermelho." : undefined)}
        tom={estado.ok ? "sucesso" : estado.mensagem || estado.erros ? "erro" : "neutro"}
      >
        <Salvar novo={novo} pendente={pendente} enviando={progresso !== null} />
      </BarraSalvar>
    </form>
  );
}
