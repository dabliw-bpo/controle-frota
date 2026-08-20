import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getStatusList, corParaClasses } from "@/lib/settings";
import SortableTh from "@/components/SortableTh";

const SORT_FIELDS = [
  "placa",
  "status",
  "carroceria",
  "marcaModeloVersao",
  "renavam",
  "chassi",
  "empresa",
  "motorista",
  "valor",
] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "placa";
  switch (field) {
    case "empresa":
      return { empresa: { nome: dir } } as const;
    default:
      return { [field]: dir } as const;
  }
}

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; sort?: string; dir?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const status = searchParams.status || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";

  const statusList = await getStatusList();
  const statusMap = new Map(statusList.map((s) => [s.chave, s]));

  const veiculos = await prisma.veiculo.findMany({
    where: {
      AND: [
        status ? { status } : {},
        q
          ? {
              OR: [
                { placa: { contains: q, mode: "insensitive" } },
                { marcaModeloVersao: { contains: q, mode: "insensitive" } },
                { motorista: { contains: q, mode: "insensitive" } },
                { responsavelTexto: { contains: q, mode: "insensitive" } },
                { motoristaCadastrado: { nome: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    include: { empresa: true, motoristaCadastrado: true },
    orderBy: getOrderBy(searchParams.sort, dir),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Veículos</h1>
          <p className="text-slate-500 text-sm mt-1">{veiculos.length} registro(s)</p>
        </div>
        <Link
          href="/veiculos/novo"
          className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
        >
          <Plus size={16} strokeWidth={2.5} />
          Novo veículo
        </Link>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por placa, modelo, motorista..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos os status</option>
          {statusList.map((s) => (
            <option key={s.chave} value={s.chave}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Status" sortKey="status" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Tipo" sortKey="carroceria" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Modelo" sortKey="marcaModeloVersao" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Renavam" sortKey="renavam" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Chassi" sortKey="chassi" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Empresa" sortKey="empresa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Motorista" sortKey="motorista" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Valor" sortKey="valor" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
            </tr>
          </thead>
          <tbody>
            {veiculos.map((v) => (
              <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/veiculos/${v.id}`} className="font-medium text-brand-600 hover:underline">
                    {v.placa}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${corParaClasses(
                      statusMap.get(v.status)?.cor
                    )}`}
                  >
                    {statusMap.get(v.status)?.label ?? v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{v.carroceria || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{v.marcaModeloVersao || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{v.renavam || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{v.chassi || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{v.empresa?.nome ?? v.responsavelTexto ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {v.motoristaCadastrado ? (
                    <Link href={`/motoristas/${v.motoristaCadastrado.id}`} className="text-brand-600 hover:underline">
                      {v.motoristaCadastrado.nome}
                    </Link>
                  ) : (
                    v.motorista || "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(v.valor)}</td>
              </tr>
            ))}
            {veiculos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Nenhum veículo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
