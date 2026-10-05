import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, placasUtilizadas } from "@/lib/format";
import RelatorioAcoes from "@/components/RelatorioAcoes";
import SortableTh from "@/components/SortableTh";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const COMISSAO_PERCENTUAL = 0.12;

const SORT_FIELDS = ["placa", "motorista", "frete", "comissao", "diarias", "total"] as const;
type SortField = (typeof SORT_FIELDS)[number];

type ComCampoOrdenavel = {
  placas: string;
  motorista: { nome: string } | null;
  frete: number;
  comissao: number;
  diarias: number;
};

function ordenar<T extends ComCampoOrdenavel>(linhas: T[], sort: string | undefined, dir: "asc" | "desc"): T[] {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "frete";
  const mult = dir === "asc" ? 1 : -1;
  return [...linhas].sort((a, b) => {
    if (field === "placa") return mult * a.placas.localeCompare(b.placas);
    if (field === "motorista")
      return mult * (a.motorista?.nome ?? "").localeCompare(b.motorista?.nome ?? "");
    if (field === "total") return mult * (a.comissao + a.diarias - (b.comissao + b.diarias));
    return mult * (a[field] - b[field]);
  });
}

export default async function RelatorioFaturamentoPage({
  searchParams,
}: {
  searchParams: { mes?: string; ano?: string; motorista?: string; placa?: string; sort?: string; dir?: string };
}) {
  const hoje = new Date();
  const mes = Number(searchParams.mes) || hoje.getMonth() + 1;
  const ano = Number(searchParams.ano) || hoje.getFullYear();
  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);
  const motoristaQ = searchParams.motorista?.trim() || "";
  const placaQ = searchParams.placa?.trim() || "";
  const dirAtual: "asc" | "desc" = searchParams.dir === "asc" ? "asc" : "desc";

  const faturamentos = await prisma.faturamentoMensal.findMany({
    where: {
      ano,
      mes,
      ...(motoristaQ ? { motorista: { nome: { contains: motoristaQ, mode: "insensitive" } } } : {}),
      ...(placaQ
        ? {
            OR: [
              { veiculo: { placa: { contains: placaQ, mode: "insensitive" } } },
              { lancamentos: { some: { placa: { contains: placaQ, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { veiculo: true, motorista: true, lancamentos: true, diarias: true },
  });

  const linhasBrutas = faturamentos.map((f) => {
    const frete = f.lancamentos.reduce((acc, l) => acc + (l.vlrFrete ?? 0), 0);
    const comissao = f.lancamentos.reduce(
      (acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)) * COMISSAO_PERCENTUAL,
      0
    );
    const diarias = f.diarias.reduce((acc, d) => acc + (d.valor ?? 0), 0);
    const placas = placasUtilizadas(f.lancamentos, f.veiculo.placa);
    return { ...f, frete, comissao, diarias, placas };
  });

  const linhas = ordenar(linhasBrutas, searchParams.sort, dirAtual);

  const totais = linhas.reduce(
    (acc, l) => ({
      frete: acc.frete + l.frete,
      comissao: acc.comissao + l.comissao,
      diarias: acc.diarias + l.diarias,
    }),
    { frete: 0, comissao: 0, diarias: 0 }
  );

  const pdfRows = linhas.map((l) => [
    l.placas,
    l.motorista?.nome ?? "—",
    formatCurrency(l.frete),
    formatCurrency(l.comissao),
    formatCurrency(l.diarias),
    formatCurrency(l.comissao + l.diarias),
  ]);

  const exportParams = new URLSearchParams({ ano: String(ano), mes: String(mes) });
  if (motoristaQ) exportParams.set("motorista", motoristaQ);
  if (placaQ) exportParams.set("placa", placaQ);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/relatorios" className="no-print text-sm text-brand-600 hover:underline">
            ← Voltar para Relatórios
          </Link>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">Análises</p>
          <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">Relatório de Faturamento</h1>
          <p className="text-slate-500 text-sm mt-1">
            {MESES[mes - 1]}/{ano} · {linhas.length} placa(s)
          </p>
        </div>
        <RelatorioAcoes
          exportHref={`/relatorios/faturamento/export?${exportParams.toString()}`}
          pdf={{
            title: "Relatório de Faturamento",
            subtitle: `${MESES[mes - 1]}/${ano} · ${linhas.length} placa(s)`,
            filename: `faturamento-${mes}-${ano}.pdf`,
            headers: ["Placa", "Motorista", "Vlr. Frete", "Comissão", "Diárias", "Comissão + Diárias"],
            rows: pdfRows,
            foot: [
              [
                "Total",
                "",
                formatCurrency(totais.frete),
                formatCurrency(totais.comissao),
                formatCurrency(totais.diarias),
                formatCurrency(totais.comissao + totais.diarias),
              ],
            ],
          }}
        />
      </div>

      <form className="no-print flex flex-wrap gap-3 items-end bg-white p-4 rounded-xl border border-slate-200">
        <label className="text-sm">
          <span className="block font-medium text-slate-700 mb-1">Mês</span>
          <select name="mes" defaultValue={mes} className="input">
            {MESES.map((nome, i) => (
              <option key={i + 1} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700 mb-1">Ano</span>
          <select name="ano" defaultValue={ano} className="input">
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700 mb-1">Motorista</span>
          <input
            type="text"
            name="motorista"
            defaultValue={motoristaQ}
            placeholder="Buscar motorista..."
            className="input"
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700 mb-1">Placa</span>
          <input
            type="text"
            name="placa"
            defaultValue={placaQ}
            placeholder="Buscar placa..."
            className="input uppercase"
          />
        </label>
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2 h-[38px]">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dirAtual} searchParams={searchParams} />
              <SortableTh label="Motorista" sortKey="motorista" currentSort={searchParams.sort} currentDir={dirAtual} searchParams={searchParams} />
              <SortableTh label="Vlr. Frete" sortKey="frete" currentSort={searchParams.sort} currentDir={dirAtual} searchParams={searchParams} />
              <SortableTh label="Comissão" sortKey="comissao" currentSort={searchParams.sort} currentDir={dirAtual} searchParams={searchParams} />
              <SortableTh label="Diárias" sortKey="diarias" currentSort={searchParams.sort} currentDir={dirAtual} searchParams={searchParams} />
              <SortableTh label="Comissão + Diárias" sortKey="total" currentSort={searchParams.sort} currentDir={dirAtual} searchParams={searchParams} />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-medium whitespace-nowrap">{l.placas}</td>
                <td className="px-4 py-2 text-slate-600">{l.motorista?.nome ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.frete)}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.comissao)}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.diarias)}</td>
                <td className="px-4 py-2 font-medium text-right whitespace-nowrap text-emerald-700">
                  {formatCurrency(l.comissao + l.diarias)}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum faturamento lançado neste período.
                </td>
              </tr>
            )}
          </tbody>
          {linhas.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                <td className="px-4 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.frete)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.comissao)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.diarias)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-emerald-700">
                  {formatCurrency(totais.comissao + totais.diarias)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
