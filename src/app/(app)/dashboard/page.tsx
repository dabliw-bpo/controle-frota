import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_VEICULO_OUTRO_MENU } from "@/lib/constants";
import { formatCurrency, placasUtilizadas } from "@/lib/format";
import { getStatusList } from "@/lib/settings";
import PieChart, { PIE_PALETTE, corNomeParaHex } from "@/components/PieChart";

const FROTA_ATIVA_WHERE = { status: { notIn: [...STATUS_VEICULO_OUTRO_MENU] as string[] } };

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
  searchParams: { mes?: string; ano?: string };
}) {
  const hoje = new Date();
  const mes = Number(searchParams.mes) || hoje.getMonth() + 1;
  const ano = Number(searchParams.ano) || hoje.getFullYear();
  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

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

  const linhasFaturamento = faturamentos
    .map((f) => {
      const abastecimento = f.lancamentos.reduce((acc, l) => acc + (l.abastecimento ?? 0), 0);
      const baseComissao = f.lancamentos.reduce(
        (acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)),
        0
      );
      const comissao = baseComissao * COMISSAO_PERCENTUAL;
      const diarias = f.diarias.reduce((acc, d) => acc + (d.valor ?? 0), 0);
      const placas = placasUtilizadas(f.lancamentos, f.veiculo.placa);
      return { ...f, abastecimento, baseComissao, comissao, diarias, placas };
    })
    .sort((a, b) => b.comissao + b.diarias - (a.comissao + a.diarias));

  const totaisFaturamento = linhasFaturamento.reduce(
    (acc, l) => ({
      abastecimento: acc.abastecimento + l.abastecimento,
      baseComissao: acc.baseComissao + l.baseComissao,
      comissao: acc.comissao + l.comissao,
      diarias: acc.diarias + l.diarias,
    }),
    { abastecimento: 0, baseComissao: 0, comissao: 0, diarias: 0 }
  );

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
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 font-medium">Placa</th>
                <th className="px-4 py-3 font-medium">Motorista</th>
                <th className="px-4 py-3 font-medium">Abastecimento</th>
                <th className="px-4 py-3 font-medium">Base Comissão</th>
                <th className="px-4 py-3 font-medium">Comissão</th>
                <th className="px-4 py-3 font-medium">Diárias</th>
                <th className="px-4 py-3 font-medium">Comissão + Diárias</th>
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
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.abastecimento)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.baseComissao)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.comissao)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.diarias)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {formatCurrency(l.comissao + l.diarias)}
                  </td>
                </tr>
              ))}
              {linhasFaturamento.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
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
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.abastecimento)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.baseComissao)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.comissao)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.diarias)}</td>
                  <td className="px-4 py-3 text-emerald-700">
                    {formatCurrency(totaisFaturamento.comissao + totaisFaturamento.diarias)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
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
