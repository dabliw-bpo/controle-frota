import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import SortableTh from "@/components/SortableTh";
import MultasExportButtons from "@/components/MultasExportButtons";

const SORT_FIELDS = ["placa", "motorista", "data"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "data";
  if (field === "placa") return { veiculo: { placa: dir } } as const;
  if (field === "motorista") return { motorista: { nome: dir } } as const;
  return { createdAt: dir } as const;
}

export default async function MultasPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; dir?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";

  const multas = await prisma.multa.findMany({
    where: q
      ? {
          OR: [
            { veiculo: { placa: { contains: q, mode: "insensitive" } } },
            { motorista: { nome: { contains: q, mode: "insensitive" } } },
            { descricao: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    include: { veiculo: true, motorista: true },
    orderBy: getOrderBy(searchParams.sort, dir),
  });

  const totalDescontar = multas.filter((m) => m.descontarMotorista).length;
  const subtitle = `${multas.length} multa(s) · ${totalDescontar} a descontar do motorista`;
  const exportRows = multas.map((m) => ({
    data: m.data || "—",
    placa: m.veiculo.placa,
    motorista: m.motorista?.nome ?? "—",
    descricao: m.descricao,
    valor: m.valor,
    descontarMotorista: m.descontarMotorista,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multas de Trânsito</h1>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MultasExportButtons rows={exportRows} subtitle={subtitle} />
          <Link
            href="/multas/novo"
            className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nova multa
          </Link>
        </div>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por placa, motorista ou descrição..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Data" sortKey="data" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Motorista" sortKey="motorista" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
            </tr>
          </thead>
          <tbody>
            {multas.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.data || "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/multas/${m.id}`} className="font-medium text-brand-600 hover:underline">
                    {m.veiculo.placa}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.motorista?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[320px] truncate" title={m.descricao}>
                  {m.descricao}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatCurrency(m.valor)}</td>
                <td className="px-4 py-3">
                  {m.descontarMotorista ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                      Desconta
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
                      Não desconta
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {multas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma multa registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
