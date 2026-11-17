"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  registrarFotoPlaca,
  salvarImovel,
  type EstadoImovel,
} from "@/app/actions/imoveis";
import {
  BarraSalvar,
  Campo,
  Cartao,
  Interruptor,
  PLACAS,
  SITUACOES,
  Segmentos,
  Seta,
  botao,
  campo,
} from "@/components/admin/ui";
import { SeletorFotos } from "@/components/admin/seletor-fotos";
import { enviarFotoPlaca, enviarFotos } from "@/lib/enviar-fotos";
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
  ref?: string;
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

  /* gestão interna — nada disto sai no site */
  situacao?: string;
  responsavel_id?: string | null;
  placa?: string;
  placa_instalada_em?: string | null;
  placa_obs?: string | null;
  placa_foto_url?: string | null;
};

export type MembroEquipe = { id: string; nome: string };

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
      {pendente || enviando ? null : <Seta />}
    </button>
  );
}

/**
 * Foto da placa. Sobe na hora, fora do formulário: quem está na rua com a
 * placa recém-instalada tira a foto e vai embora, sem tocar em "salvar".
 */
function FotoPlaca({
  propertyId,
  refImovel,
  url,
}: {
  propertyId: string;
  refImovel: string;
  url: string | null;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;

    setErro(null);
    setOcupado(true);
    const resposta = await enviarFotoPlaca({ propertyId, refImovel, arquivo });
    setOcupado(false);

    if (resposta.erro) setErro(resposta.erro);
    else router.refresh();
  }

  async function remover() {
    setOcupado(true);
    await registrarFotoPlaca(propertyId, null);
    setOcupado(false);
    router.refresh();
  }

  return (
    <div className="min-w-0">
      <span className="block text-sm font-medium">Foto da placa instalada</span>

      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        {url ? (
          <Image
            src={url}
            alt="Placa instalada neste imóvel"
            width={80}
            height={80}
            className="size-20 shrink-0 rounded-xl border border-border-base object-cover"
          />
        ) : null}

        <label
          className={cn(
            botao.secundario,
            "cursor-pointer",
            ocupado && "pointer-events-none opacity-60",
          )}
        >
          {ocupado ? "Enviando…" : url ? "Trocar foto" : "Enviar foto"}
          <input
            type="file"
            accept="image/*"
            onChange={escolher}
            disabled={ocupado}
            className="sr-only"
          />
        </label>

        {url ? (
          <button type="button" onClick={remover} disabled={ocupado} className={botao.suave}>
            Remover
          </button>
        ) : null}
      </div>

      <p className="mt-1.5 text-xs text-fg-muted">
        Sobe na hora, sem precisar salvar o cadastro.
      </p>

      {erro ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export function PropertyForm({
  imovel,
  equipe,
}: {
  imovel?: ImovelForm;
  equipe: MembroEquipe[];
}) {
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

      <Cartao
        titulo="Gestão interna"
        descricao="Só a equipe vê. Nada daqui aparece no site."
      >
        <div className="grid gap-5">
          <div>
            <span className="block text-sm font-medium">Situação do negócio</span>
            <Segmentos
              nome="situacao"
              valor={imovel?.situacao ?? "disponivel"}
              opcoes={SITUACOES}
              className="grid-cols-2 grid-flow-row sm:auto-cols-fr sm:grid-flow-col"
            />
            <p className="mt-1.5 text-xs text-fg-muted">
              Não muda o que aparece no site — para tirar do ar, use Situação lá
              em cima.
            </p>
          </div>

          <Campo
            nome="responsavel_id"
            rotulo="Responsável"
            dica="Quem cuida deste imóvel no dia a dia."
          >
            <select
              id="responsavel_id"
              name="responsavel_id"
              defaultValue={imovel?.responsavel_id ?? ""}
              className={campo}
            >
              <option value="">Ninguém ainda</option>
              {equipe.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </option>
              ))}
            </select>
          </Campo>

          <div>
            <span className="block text-sm font-medium">Placa no imóvel</span>
            <Segmentos nome="placa" valor={imovel?.placa ?? "sem_placa"} opcoes={PLACAS} />
          </div>

          <Campo
            nome="placa_instalada_em"
            rotulo="Placa instalada em"
            dica="Deixe vazio se ainda não foi."
            erro={erro("placa_instalada_em")}
          >
            <input
              id="placa_instalada_em"
              name="placa_instalada_em"
              type="date"
              defaultValue={imovel?.placa_instalada_em ?? ""}
              className={cn(campo, "numeros")}
            />
          </Campo>

          <Campo
            nome="placa_obs"
            rotulo="Observações da placa"
            dica="Ex.: placa torta, o vizinho reclamou, precisa trocar."
          >
            <textarea
              id="placa_obs"
              name="placa_obs"
              rows={3}
              defaultValue={imovel?.placa_obs ?? ""}
              className={cn(campo, "resize-y leading-relaxed")}
            />
          </Campo>

          {imovel?.id && imovel.ref ? (
            <FotoPlaca
              propertyId={imovel.id}
              refImovel={imovel.ref}
              url={imovel.placa_foto_url ?? null}
            />
          ) : null}
        </div>
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
