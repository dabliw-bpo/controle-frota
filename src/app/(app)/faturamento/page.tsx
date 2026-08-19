import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SortableTh from "@/components/SortableTh";

const SORT_FIELDS = ["nome", "placa"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "nome";
  if (field === "placa") return { veiculo: { placa: dir } } as const;
  return { [field]: dir } as const;
}

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; dir?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";

  const motoristas = await prisma.motorista.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q.replace(/\D/g, "") } },
            { veiculo: { placa: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {},
    include: { veiculo: true },
    orderBy: getOrderBy(searchParams.sort, dir),
  });

  const comPlaca = motoristas.filter((m) => m.veiculo).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faturamento</h1>
          <p className="text-slate-500 text-sm mt-1">
            {motoristas.length} motorista(s) · {comPlaca} com placa vinculada
          </p>
        </div>
        <Link
          href="/faturamento/novo"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          + Novo faturamento
        </Link>
      </div>

      <form className="flex gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por motorista, CPF ou placa..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Motorista" sortKey="nome" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <th className="px-4 py-3 text-right">Faturar</th>
            </tr>
          </thead>
          <tbody>
            {motoristas.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/motoristas/${m.id}`} className="font-medium text-brand-600 hover:underline">
                    {m.nome}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {m.veiculo ? (
                    <Link href={`/veiculos/${m.veiculo.id}`} className="font-medium text-brand-600 hover:underline">
                      {m.veiculo.placa}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Sem placa vinculada</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.veiculo && (
                    <Link
                      href={`/faturamento/${m.veiculo.id}`}
                      title="Lançar faturamento"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-base"
                    >
                      💰
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {motoristas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Nenhum motorista encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
