import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_VEICULO_OUTRO_MENU } from "@/lib/constants";
import { formatCurrency, placasUtilizadas } from "@/lib/format";
import { getStatusList } from "@/lib/settings";
import PieChart, { PIE_PALETTE, corNomeParaHex } from "@/components/PieChart";
import SortableTh from "@/components/SortableTh";
import DashboardFaturamentoExport from "@/components/DashboardFaturamentoExport";

const FROTA_ATIVA_WHERE = { status: { notIn: [...STATUS_VEICULO_OUTRO_MENU] as string[] } };

const SORT_FIELDS = ["placa", "motorista", "frete", "abastecimento", "comissao", "diarias", "lucro", "margem"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function ordenarFaturamento<
  T extends {
    placas: string;
    motorista: { nome: string } | null;
    frete: number;
    abastecimento: number;
    comissao: number;
    diarias: number;
    lucro: number;
    margem: number;
  }
>(linhas: T[], sort: string | undefined, dir: "asc" | "desc"): T[] {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "lucro";
  const mult = dir === "asc" ? 1 : -1;
  return [...linhas].sort((a, b) => {
    if (field === "placa") return mult * a.placas.localeCompare(b.placas);
    if (field === "motorista") return mult * (a.motorista?.nome ?? "").localeCompare(b.motorista?.nome ?? "");
    return mult * (a[field] - b[field]);
  });
}

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { mes?: string; ano?: string; sort?: string; dir?: string };
}) {
  const hoje = new Date();
  const mes = Number(searchParams.mes) || hoje.getMonth() + 1;
  const ano = Number(searchParams.ano) || hoje.getFullYear();
  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);
  const dir: "asc" | "desc" = searchParams.dir === "asc" ? "asc" : "desc";

  const statusList = await getStatusList();
  const [total, porStatus, porTipo, porEmpresa, motoristasCount, veiculosLeves, veiculos, faturamentos] =
    await Promise.all([
      prisma.veiculo.count({ where: FROTA_ATIVA_WHERE }),
      prisma.veiculo.groupBy({ by: ["status"], where: FROTA_ATIVA_WHERE, _count: { status: true } }),
      prisma.veiculo.groupBy({ by: ["carroceria"], where: FROTA_ATIVA_WHERE, _count: { carroceria: true } }),
      prisma.veiculo.groupBy({ by: ["empresaId"], where: FROTA_ATIVA_WHERE, _count: { empresaId: true } }),
      prisma.motorista.count(),
      prisma.veiculo.count({ where: { ...FROTA_ATIVA_WHERE, carroceria: "CARRO" } }),
      prisma.veiculo.findMany({ where: FROTA_ATIVA_WHERE, select: { valor: true } }),
      prisma.faturamentoMensal.findMany({
        where: { ano, mes },
        include: { veiculo: true, motorista: true, lancamentos: true, diarias: true },
      }),
    ]);

  const statusMap = new Map(porStatus.map((s) => [s.status, s._count.status]));
  const valorTotalFrota = veiculos.reduce((acc, v) => acc + (v.valor ?? 0), 0);

  const tipos = porTipo
    .filter((t) => t.carroceria)
    .sort((a, b) => b._count.carroceria - a._count.carroceria);

  const empresas = await prisma.empresa.findMany();
  const empresaMap = new Map(empresas.map((e) => [e.id, e.nome]));

  const linhasFaturamentoBrutas = faturamentos.map((f) => {
    const frete = f.lancamentos.reduce((acc, l) => acc + (l.vlrFrete ?? 0), 0);
    const abastecimento = f.lancamentos.reduce((acc, l) => acc + (l.abastecimento ?? 0), 0);
    const despesas = f.lancamentos.reduce((acc, l) => acc + (l.despesas ?? 0), 0);
    const pedagio = f.lancamentos.reduce((acc, l) => acc + (l.pedagio ?? 0), 0);
    const comissao = f.lancamentos.reduce(
      (acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)) * COMISSAO_PERCENTUAL,
      0
    );
    const diarias = f.diarias.reduce((acc, d) => acc + (d.valor ?? 0), 0);
    const lucro = frete - abastecimento - despesas - pedagio - comissao;
    const margem = frete > 0 ? lucro / frete : 0;
    const placas = placasUtilizadas(f.lancamentos, f.veiculo.placa);
    return { ...f, frete, abastecimento, despesas, pedagio, comissao, diarias, lucro, margem, placas };
  });

  const linhasFaturamento = ordenarFaturamento(linhasFaturamentoBrutas, searchParams.sort, dir);

  const totaisFaturamento = linhasFaturamento.reduce(
    (acc, l) => ({
      frete: acc.frete + l.frete,
      abastecimento: acc.abastecimento + l.abastecimento,
      comissao: acc.comissao + l.comissao,
      diarias: acc.diarias + l.diarias,
      lucro: acc.lucro + l.lucro,
    }),
    { frete: 0, abastecimento: 0, comissao: 0, diarias: 0, lucro: 0 }
  );
  const margemMedia = totaisFaturamento.frete > 0 ? totaisFaturamento.lucro / totaisFaturamento.frete : 0;

  type Agregado = { chave: string; label: string; frete: number; abastecimento: number; comissao: number; diarias: number; lucro: number };

  const porMotoristaMap = new Map<string, Agregado>();
  for (const l of linhasFaturamento) {
    const chave = l.motoristaId ?? "sem-motorista";
    const atual =
      porMotoristaMap.get(chave) ??
      { chave, label: l.motorista?.nome ?? "Sem motorista", frete: 0, abastecimento: 0, comissao: 0, diarias: 0, lucro: 0 };
    atual.frete += l.frete;
    atual.abastecimento += l.abastecimento;
    atual.comissao += l.comissao;
    atual.diarias += l.diarias;
    atual.lucro += l.lucro;
    porMotoristaMap.set(chave, atual);
  }
  const porMotorista = Array.from(porMotoristaMap.values()).sort((a, b) => b.lucro - a.lucro);

  const porPlacaMap = new Map<string, Agregado>();
  for (const f of faturamentos) {
    for (const l of f.lancamentos) {
      const chave = (l.placa || f.veiculo.placa || "").trim().toUpperCase() || "—";
      const atual =
        porPlacaMap.get(chave) ?? { chave, label: chave, frete: 0, abastecimento: 0, comissao: 0, diarias: 0, lucro: 0 };
      const frete = l.vlrFrete ?? 0;
      const abastecimento = l.abastecimento ?? 0;
      const despesas = l.despesas ?? 0;
      const pedagio = l.pedagio ?? 0;
      const comissao = (frete - (l.seguro ?? 0) - (l.adm ?? 0)) * COMISSAO_PERCENTUAL;
      atual.frete += frete;
      atual.abastecimento += abastecimento;
      atual.comissao += comissao;
      atual.lucro += frete - abastecimento - despesas - pedagio - comissao;
      porPlacaMap.set(chave, atual);
    }
    for (const d of f.diarias) {
      const chave = (d.placa || f.veiculo.placa || "").trim().toUpperCase() || "—";
      const atual =
        porPlacaMap.get(chave) ?? { chave, label: chave, frete: 0, abastecimento: 0, comissao: 0, diarias: 0, lucro: 0 };
      atual.diarias += d.valor ?? 0;
      porPlacaMap.set(chave, atual);
    }
  }
  const porPlaca = Array.from(porPlacaMap.values()).sort((a, b) => b.lucro - a.lucro);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Visão geral da frota ativa (não inclui alugados/vendidos)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Valor total (frota)" value={formatCurrency(valorTotalFrota)} colSpan={2} />
        <StatCard label="Total de veículos" value={total.toString()} />
        <StatCard label="Ativos" value={(statusMap.get("ATIVO") ?? 0).toString()} />
        <StatCard label="Em manutenção" value={(statusMap.get("MANUTENCAO") ?? 0).toString()} />
        <StatCard label="Motoristas" value={motoristasCount.toString()} />
        <StatCard label="Veículos leves (carros)" value={veiculosLeves.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por status</h2>
          <PieChart
            data={statusList
              .map((status) => ({
                label: status.label,
                value: statusMap.get(status.chave) ?? 0,
                color: corNomeParaHex(status.cor),
              }))
              .filter((d) => d.value > 0)}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por tipo</h2>
          <PieChart
            data={tipos.map((t, i) => ({
              label: t.carroceria ?? "—",
              value: t._count.carroceria,
              color: PIE_PALETTE[i % PIE_PALETTE.length],
            }))}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por empresa</h2>
          <PieChart
            data={porEmpresa
              .filter((e) => e.empresaId)
              .map((e, i) => ({
                label: empresaMap.get(e.empresaId!) ?? "—",
                value: e._count.empresaId,
                color: PIE_PALETTE[i % PIE_PALETTE.length],
              }))}
          />
        </div>
      </div>

      {/* Faturamento */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Faturamento</h2>
          <div className="flex flex-wrap items-end gap-2">
            <form className="flex gap-2 items-end">
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
              <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 h-[38px]">
                Filtrar
              </button>
            </form>
            <DashboardFaturamentoExport
              linhas={linhasFaturamento.map((l) => ({
                placa: l.placas,
                motorista: l.motorista?.nome ?? "—",
                frete: l.frete,
                abastecimento: l.abastecimento,
                comissao: l.comissao,
                diarias: l.diarias,
                lucro: l.lucro,
                margem: l.margem,
              }))}
              totais={totaisFaturamento}
              margemMedia={margemMedia}
              mesNome={MESES[mes - 1]}
              ano={ano}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Vlr. Frete" value={formatCurrency(totaisFaturamento.frete)} />
          <StatCard label="Abastecimento" value={formatCurrency(totaisFaturamento.abastecimento)} />
          <StatCard label="Comissão" value={formatCurrency(totaisFaturamento.comissao)} />
          <StatCard
            label="Lucro (margem média)"
            value={`${formatCurrency(totaisFaturamento.lucro)} · ${formatPercent(margemMedia)}`}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
                <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Motorista" sortKey="motorista" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Vlr. Frete" sortKey="frete" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Abastecimento" sortKey="abastecimento" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Comissão" sortKey="comissao" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Diárias" sortKey="diarias" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Lucro" sortKey="lucro" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
                <SortableTh label="Margem" sortKey="margem" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              </tr>
            </thead>
            <tbody>
              {linhasFaturamento.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/faturamento/${l.veiculoId}?ano=${ano}&mes=${mes}`} className="font-medium text-brand-600 hover:underline">
                      {l.placas}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.motorista?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.frete)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.abastecimento)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.comissao)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.diarias)}</td>
                  <td
                    className={`px-4 py-3 font-medium ${l.lucro >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {formatCurrency(l.lucro)}
                  </td>
                  <td className="px-4 py-3">
                    <MargemBadge margem={l.margem} />
                  </td>
                </tr>
              ))}
              {linhasFaturamento.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Nenhum faturamento lançado neste período.
                  </td>
                </tr>
              )}
            </tbody>
            {linhasFaturamento.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                  <td className="px-4 py-3" colSpan={2}>
                    Total ({linhasFaturamento.length})
                  </td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.frete)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.abastecimento)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.comissao)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.diarias)}</td>
                  <td className={totaisFaturamento.lucro >= 0 ? "text-emerald-700 px-4 py-3" : "text-red-600 px-4 py-3"}>
                    {formatCurrency(totaisFaturamento.lucro)}
                  </td>
                  <td className="px-4 py-3">{formatPercent(margemMedia)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Lucro = Vlr. Frete − Abastecimento − Despesas − Pedágio − Comissão. Não inclui custos fixos
          mensais (parcela do cavalo, seguro, rastreador), que não são lançados no sistema.
        </p>
      </div>

      {/* Demonstrativo por Motorista */}
      <DemonstrativoTable
        titulo="Demonstrativo de faturamento por Motorista"
        colunaLabel="Motorista"
        linhas={porMotorista}
      />

      {/* Demonstrativo por Placa */}
      <DemonstrativoTable
        titulo="Demonstrativo de faturamento por Placa"
        colunaLabel="Placa"
        linhas={porPlaca}
      />
    </div>
  );
}

function DemonstrativoTable({
  titulo,
  colunaLabel,
  linhas,
}: {
  titulo: string;
  colunaLabel: string;
  linhas: { chave: string; label: string; frete: number; abastecimento: number; comissao: number; diarias: number; lucro: number }[];
}) {
  const totais = linhas.reduce(
    (acc, l) => ({
      frete: acc.frete + l.frete,
      abastecimento: acc.abastecimento + l.abastecimento,
      comissao: acc.comissao + l.comissao,
      diarias: acc.diarias + l.diarias,
      lucro: acc.lucro + l.lucro,
    }),
    { frete: 0, abastecimento: 0, comissao: 0, diarias: 0, lucro: 0 }
  );
  const margemMedia = totais.frete > 0 ? totais.lucro / totais.frete : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">{colunaLabel}</th>
              <th className="px-4 py-3 font-medium">Vlr. Frete</th>
              <th className="px-4 py-3 font-medium">Abastecimento</th>
              <th className="px-4 py-3 font-medium">Comissão</th>
              <th className="px-4 py-3 font-medium">Diárias</th>
              <th className="px-4 py-3 font-medium">Lucro</th>
              <th className="px-4 py-3 font-medium">Margem</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const margem = l.frete > 0 ? l.lucro / l.frete : 0;
              return (
                <tr key={l.chave} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{l.label}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.frete)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.abastecimento)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.comissao)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.diarias)}</td>
                  <td className={`px-4 py-3 font-medium ${l.lucro >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {formatCurrency(l.lucro)}
                  </td>
                  <td className="px-4 py-3">
                    <MargemBadge margem={margem} />
                  </td>
                </tr>
              );
            })}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nenhum faturamento lançado neste período.
                </td>
              </tr>
            )}
          </tbody>
          {linhas.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                <td className="px-4 py-3">Total ({linhas.length})</td>
                <td className="px-4 py-3">{formatCurrency(totais.frete)}</td>
                <td className="px-4 py-3">{formatCurrency(totais.abastecimento)}</td>
                <td className="px-4 py-3">{formatCurrency(totais.comissao)}</td>
                <td className="px-4 py-3">{formatCurrency(totais.diarias)}</td>
                <td className={totais.lucro >= 0 ? "text-emerald-700 px-4 py-3" : "text-red-600 px-4 py-3"}>
                  {formatCurrency(totais.lucro)}
                </td>
                <td className="px-4 py-3">{formatPercent(margemMedia)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: string;
  colSpan?: 2;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 xl:p-5 min-w-0 ${
        colSpan === 2 ? "col-span-2" : ""
      }`}
    >
      <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
      <p className="text-lg xl:text-xl font-bold text-slate-900 mt-1 whitespace-nowrap overflow-x-auto">
        {value}
      </p>
    </div>
  );
}

function formatPercent(v: number): string {
  return `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

function MargemBadge({ margem }: { margem: number }) {
  const cor =
    margem >= 0.2
      ? "bg-emerald-100 text-emerald-800"
      : margem >= 0
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cor}`}>
      {formatPercent(margem)}
    </span>
  );
}
