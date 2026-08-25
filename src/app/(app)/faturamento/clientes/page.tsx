import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SortableTh from "@/components/SortableTh";

const SORT_FIELDS = ["nome", "cnpj", "cidade"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "nome";
  return { [field]: dir } as const;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; dir?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cnpj: { contains: q, mode: "insensitive" } },
            { cidade: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: getOrderBy(searchParams.sort, dir),
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/faturamento" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Faturamento
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">{clientes.length} registro(s)</p>
        </div>
        <Link
          href="/faturamento/clientes/novo"
          className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
        >
          <Plus size={16} strokeWidth={2.5} />
          Novo cliente
        </Link>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, CNPJ ou cidade..."
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
              <SortableTh label="Nome" sortKey="nome" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="CNPJ" sortKey="cnpj" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Cidade/UF" sortKey="cidade" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <th className="px-4 py-3 font-medium">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/faturamento/clientes/${c.id}`} className="font-medium text-brand-600 hover:underline">
                    {c.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.cnpj || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.cidade ? `${c.cidade}${c.uf ? `/${c.uf}` : ""}` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.telefone || "—"}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
