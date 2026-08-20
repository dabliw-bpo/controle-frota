import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, placasUtilizadas } from "@/lib/format";
import RelatorioAcoes from "@/components/RelatorioAcoes";

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

export default async function RelatorioFaturamentoPage({
  searchParams,
}: {
  searchParams: { mes?: string; ano?: string };
}) {
  const hoje = new Date();
  const mes = Number(searchParams.mes) || hoje.getMonth() + 1;
  const ano = Number(searchParams.ano) || hoje.getFullYear();
  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

  const faturamentos = await prisma.faturamentoMensal.findMany({
    where: { ano, mes },
    include: { veiculo: true, motorista: true, lancamentos: true },
  });

  const linhas = faturamentos
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
      const placas = placasUtilizadas(f.lancamentos, f.veiculo.placa);
      return { ...f, frete, abastecimento, despesas, pedagio, comissao, lucro, placas };
    })
    .sort((a, b) => b.frete - a.frete);

  const totais = linhas.reduce(
    (acc, l) => ({
      frete: acc.frete + l.frete,
      abastecimento: acc.abastecimento + l.abastecimento,
      despesas: acc.despesas + l.despesas,
      pedagio: acc.pedagio + l.pedagio,
      comissao: acc.comissao + l.comissao,
      lucro: acc.lucro + l.lucro,
    }),
    { frete: 0, abastecimento: 0, despesas: 0, pedagio: 0, comissao: 0, lucro: 0 }
  );

  const pdfRows = linhas.map((l) => [
    l.placas,
    l.motorista?.nome ?? "—",
    formatCurrency(l.frete),
    formatCurrency(l.despesas),
    formatCurrency(l.abastecimento),
    formatCurrency(l.pedagio),
    formatCurrency(l.comissao),
    formatCurrency(l.lucro),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/relatorios" className="no-print text-sm text-brand-600 hover:underline">
            ← Voltar para Relatórios
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Relatório de Faturamento</h1>
          <p className="text-slate-500 text-sm mt-1">
            {MESES[mes - 1]}/{ano} · {linhas.length} placa(s)
          </p>
        </div>
        <RelatorioAcoes
          exportHref={`/relatorios/faturamento/export?ano=${ano}&mes=${mes}`}
          pdf={{
            title: "Relatório de Faturamento",
            subtitle: `${MESES[mes - 1]}/${ano} · ${linhas.length} placa(s)`,
            filename: `faturamento-${mes}-${ano}.pdf`,
            headers: ["Placa", "Motorista", "Vlr. Frete", "Despesas", "Abastecimento", "Pedágio", "Comissão", "Lucro"],
            rows: pdfRows,
            foot: [
              [
                "Total",
                "",
                formatCurrency(totais.frete),
                formatCurrency(totais.despesas),
                formatCurrency(totais.abastecimento),
                formatCurrency(totais.pedagio),
                formatCurrency(totais.comissao),
                formatCurrency(totais.lucro),
              ],
            ],
          }}
        />
      </div>

      <form className="no-print flex gap-2 items-end bg-white p-4 rounded-xl border border-slate-200">
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Motorista</th>
              <th className="px-4 py-3 font-medium text-right">Vlr. Frete</th>
              <th className="px-4 py-3 font-medium text-right">Despesas</th>
              <th className="px-4 py-3 font-medium text-right">Abastecimento</th>
              <th className="px-4 py-3 font-medium text-right">Pedágio</th>
              <th className="px-4 py-3 font-medium text-right">Comissão</th>
              <th className="px-4 py-3 font-medium text-right">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-medium whitespace-nowrap">{l.placas}</td>
                <td className="px-4 py-2 text-slate-600">{l.motorista?.nome ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.frete)}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.despesas)}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.abastecimento)}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.pedagio)}</td>
                <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">{formatCurrency(l.comissao)}</td>
                <td
                  className={`px-4 py-2 font-medium text-right whitespace-nowrap ${
                    l.lucro >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {formatCurrency(l.lucro)}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
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
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.despesas)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.abastecimento)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.pedagio)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totais.comissao)}</td>
                <td
                  className={`px-4 py-3 text-right whitespace-nowrap ${
                    totais.lucro >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {formatCurrency(totais.lucro)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
