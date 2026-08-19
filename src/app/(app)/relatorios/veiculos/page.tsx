import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getStatusList, corParaClasses } from "@/lib/settings";
import RelatorioAcoes from "@/components/RelatorioAcoes";

export default async function RelatorioVeiculosPage() {
  const [veiculos, statusList] = await Promise.all([
    prisma.veiculo.findMany({
      include: { empresa: true, motoristaCadastrado: true },
      orderBy: { placa: "asc" },
    }),
    getStatusList(),
  ]);

  const statusMap = new Map(statusList.map((s) => [s.chave, s]));
  const valorTotal = veiculos.reduce((acc, v) => acc + (v.valor ?? 0), 0);

  const pdfRows = veiculos.map((v) => [
    v.placa,
    statusMap.get(v.status)?.label ?? v.status,
    v.carroceria || "—",
    v.marcaModeloVersao || "—",
    v.renavam || "—",
    v.chassi || "—",
    v.empresa?.nome ?? v.responsavelTexto ?? "—",
    v.motoristaCadastrado?.nome ?? v.motorista ?? "—",
    formatCurrency(v.valor),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/relatorios" className="no-print text-sm text-brand-600 hover:underline">
            ← Voltar para Relatórios
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Relatório de Veículos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {veiculos.length} veículo(s) · valor total {formatCurrency(valorTotal)}
          </p>
        </div>
        <RelatorioAcoes
          exportHref="/relatorios/veiculos/export"
          pdf={{
            title: "Relatório de Veículos",
            subtitle: `${veiculos.length} veículo(s) · valor total ${formatCurrency(valorTotal)}`,
            filename: "veiculos.pdf",
            headers: ["Placa", "Status", "Tipo", "Modelo", "Renavam", "Chassi", "Empresa", "Motorista", "Valor"],
            rows: pdfRows,
            foot: [["Total", "", "", "", "", "", "", "", formatCurrency(valorTotal)]],
          }}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">Placa</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Modelo</th>
              <th className="px-4 py-3 font-medium">Renavam</th>
              <th className="px-4 py-3 font-medium">Chassi</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Motorista</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {veiculos.map((v) => {
              const status = statusMap.get(v.status);
              return (
                <tr key={v.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{v.placa}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${corParaClasses(
                        status?.cor
                      )}`}
                    >
                      {status?.label ?? v.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{v.carroceria || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{v.marcaModeloVersao || "—"}</td>
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{v.renavam || "—"}</td>
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{v.chassi || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{v.empresa?.nome ?? v.responsavelTexto ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                    {v.motoristaCadastrado?.nome ?? v.motorista ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-600 text-right whitespace-nowrap">
                    {formatCurrency(v.valor)}
                  </td>
                </tr>
              );
            })}
            {veiculos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Nenhum veículo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
          {veiculos.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                <td className="px-4 py-3" colSpan={8}>
                  Total
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(valorTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
