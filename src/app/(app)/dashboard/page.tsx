import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_VEICULO_OUTRO_MENU } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getStatusList, corParaClasses } from "@/lib/settings";

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
        include: { veiculo: true, motorista: true, lancamentos: true },
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
      const frete = f.lancamentos.reduce((acc, l) => acc + (l.vlrFrete ?? 0), 0);
      const abastecimento = f.lancamentos.reduce((acc, l) => acc + (l.abastecimento ?? 0), 0);
      const despesas = f.lancamentos.reduce((acc, l) => acc + (l.despesas ?? 0), 0);
      const pedagio = f.lancamentos.reduce((acc, l) => acc + (l.pedagio ?? 0), 0);
      const comissao = f.lancamentos.reduce(
        (acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)) * COMISSAO_PERCENTUAL,
        0
      );
      const lucro = frete - abastecimento - despesas - pedagio - comissao;
      const margem = frete > 0 ? lucro / frete : 0;
      return { ...f, frete, abastecimento, despesas, pedagio, comissao, lucro, margem };
    })
    .sort((a, b) => b.lucro - a.lucro);

  const totaisFaturamento = linhasFaturamento.reduce(
    (acc, l) => ({
      frete: acc.frete + l.frete,
      abastecimento: acc.abastecimento + l.abastecimento,
      comissao: acc.comissao + l.comissao,
      lucro: acc.lucro + l.lucro,
    }),
    { frete: 0, abastecimento: 0, comissao: 0, lucro: 0 }
  );
  const margemMedia = totaisFaturamento.frete > 0 ? totaisFaturamento.lucro / totaisFaturamento.frete : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Visão geral da frota ativa (não inclui alugados/vendidos)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total de veículos" value={total.toString()} />
        <StatCard label="Ativos" value={(statusMap.get("ATIVO") ?? 0).toString()} />
        <StatCard label="Em manutenção" value={(statusMap.get("MANUTENCAO") ?? 0).toString()} />
        <StatCard label="Motoristas" value={motoristasCount.toString()} />
        <StatCard label="Veículos leves (carros)" value={veiculosLeves.toString()} />
        <StatCard label="Valor total (frota)" value={formatCurrency(valorTotalFrota)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por status</h2>
          <div className="space-y-2">
            {statusList.map((status) => {
              const count = statusMap.get(status.chave) ?? 0;
              if (count === 0) return null;
              return (
                <div key={status.chave} className="flex items-center justify-between text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${corParaClasses(
                      status.cor
                    )}`}
                  >
                    {status.label}
                  </span>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por tipo</h2>
          <div className="space-y-2">
            {tipos.map((t) => (
              <div key={t.carroceria} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t.carroceria}</span>
                <span className="font-medium text-slate-700">{t._count.carroceria}</span>
              </div>
            ))}
            {tipos.length === 0 && <p className="text-sm text-slate-400">Nenhum registro.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por empresa</h2>
          <div className="space-y-2">
            {porEmpresa
              .filter((e) => e.empresaId)
              .map((e) => (
                <div key={e.empresaId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 truncate pr-2">
                    {empresaMap.get(e.empresaId!) ?? "—"}
                  </span>
                  <span className="font-medium text-slate-700">{e._count.empresaId}</span>
                </div>
              ))}
          </div>
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
                <th className="px-4 py-3 font-medium">Placa</th>
                <th className="px-4 py-3 font-medium">Motorista</th>
                <th className="px-4 py-3 font-medium">Vlr. Frete</th>
                <th className="px-4 py-3 font-medium">Abastecimento</th>
                <th className="px-4 py-3 font-medium">Comissão</th>
                <th className="px-4 py-3 font-medium">Lucro</th>
                <th className="px-4 py-3 font-medium">Margem</th>
              </tr>
            </thead>
            <tbody>
              {linhasFaturamento.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/faturamento/${l.veiculoId}?ano=${ano}&mes=${mes}`} className="font-medium text-brand-600 hover:underline">
                      {l.veiculo.placa}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{l.motorista?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.frete)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.abastecimento)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.comissao)}</td>
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
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.frete)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.abastecimento)}</td>
                  <td className="px-4 py-3">{formatCurrency(totaisFaturamento.comissao)}</td>
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1 break-words">{value}</p>
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
