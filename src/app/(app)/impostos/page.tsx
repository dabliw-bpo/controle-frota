import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import SortableTh from "@/components/SortableTh";

const SORT_FIELDS = [
  "placa",
  "empresa",
  "licenciamentoVencimento",
  "licenciamentoValor",
  "ipvaVencimento",
  "multasValor",
] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField)
    ? (sort as SortField)
    : "licenciamentoVencimento";
  switch (field) {
    case "placa":
      return { veiculo: { placa: dir } } as const;
    case "empresa":
      return { veiculo: { responsavelTexto: dir } } as const;
    default:
      return { [field]: dir } as const;
  }
}

export default async function ImpostosPage({
  searchParams,
}: {
  searchParams: { ano?: string; sort?: string; dir?: string };
}) {
  const anos = await prisma.impostoAnual.findMany({
    distinct: ["ano"],
    select: { ano: true },
    orderBy: { ano: "desc" },
  });

  const anoSelecionado = searchParams.ano ? Number(searchParams.ano) : anos[0]?.ano;
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";

  const impostos = anoSelecionado
    ? await prisma.impostoAnual.findMany({
        where: { ano: anoSelecionado },
        include: { veiculo: true },
        orderBy: getOrderBy(searchParams.sort, dir),
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">IPVA / Licenciamento</h1>
        <p className="text-slate-500 text-sm mt-1">Controle anual por veículo</p>
      </div>

      <div className="flex gap-2">
        {anos.map((a) => (
          <Link
            key={a.ano}
            href={`/impostos?ano=${a.ano}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium border ${
              a.ano === anoSelecionado
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {a.ano}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Empresa" sortKey="empresa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Venc. licenciamento" sortKey="licenciamentoVencimento" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Valor licenc." sortKey="licenciamentoValor" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Venc. IPVA" sortKey="ipvaVencimento" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Multas" sortKey="multasValor" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
            </tr>
          </thead>
          <tbody>
            {impostos.map((i) => (
              <tr key={i.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/veiculos/${i.veiculoId}`} className="font-medium text-brand-600 hover:underline">
                    {i.veiculo.placa}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{i.veiculo.responsavelTexto || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{i.licenciamentoVencimento || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(i.licenciamentoValor)}</td>
                <td className="px-4 py-3 text-slate-600">{i.ipvaVencimento || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(i.multasValor)}</td>
              </tr>
            ))}
            {impostos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum registro para este ano.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
