import Link from "next/link";
import { Wallet, Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SortableTh from "@/components/SortableTh";
import { parseSituacao, situacaoWhere } from "@/lib/situacao";

const SORT_FIELDS = ["nome"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "nome";
  return { [field]: dir } as const;
}

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; dir?: string; situacao?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";
  const situacao = parseSituacao(searchParams.situacao);

  const motoristas = await prisma.motorista.findMany({
    where: {
      ...situacaoWhere(situacao),
      ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { cpf: { contains: q.replace(/\D/g, "") } },
            { veiculo: { placa: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    },
    include: { veiculo: true },
    orderBy: getOrderBy(searchParams.sort, dir),
  });

  const comPlaca = motoristas.filter((m) => m.veiculo).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-500">Financeiro</p>
          <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">Faturamento</h1>
          <p className="text-slate-500 text-sm mt-1">
            {motoristas.length} motorista(s) · {comPlaca} com placa vinculada
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/faturamento/clientes"
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg px-4 py-2.5"
          >
            <Users size={16} strokeWidth={2} />
            Clientes
          </Link>
          <Link
            href="/faturamento/novo"
            className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo faturamento
          </Link>
        </div>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por motorista, CPF ou placa..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20"
        />
        <select name="situacao" defaultValue={situacao} aria-label="Situação" className="input sm:w-40">
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Motorista" sortKey="nome" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
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
                <td className="px-4 py-3 text-right">
                  {m.veiculo && (
                    <Link
                      href={`/faturamento/${m.veiculo.id}?motoristaId=${m.id}`}
                      title="Lançar faturamento"
                      aria-label={`Lançar faturamento de ${m.nome}`}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 text-white"
                    >
                      <Wallet size={16} strokeWidth={2} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {motoristas.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
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
