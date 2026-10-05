import Link from "next/link";
import { Wallet, Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import SortableTh from "@/components/SortableTh";
import BotaoImprimir from "@/components/BotaoImprimir";
import { parseSituacao, situacaoWhere } from "@/lib/situacao";

const COMISSAO_PERCENTUAL = 0.12;
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const SITUACAO_LABEL = { ativos: "Motoristas ativos", inativos: "Motoristas inativos", todos: "Todos os motoristas" } as const;

const SORT_FIELDS = ["nome"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "nome";
  return { [field]: dir } as const;
}

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; dir?: string; situacao?: string; ano?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";
  const situacao = parseSituacao(searchParams.situacao);
  const anoAtual = new Date().getFullYear();
  const ano = Number(searchParams.ano) || anoAtual;
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

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

  // Comissão (12% da base) + diárias de cada motorista, mês a mês. Um motorista
  // pode ter registros em mais de um veículo no mesmo mês, então soma-se tudo.
  const faturamentos = await prisma.faturamentoMensal.findMany({
    where: { ano, motoristaId: { in: motoristas.map((m) => m.id) } },
    select: {
      motoristaId: true,
      mes: true,
      veiculoId: true,
      lancamentos: { select: { vlrFrete: true, seguro: true, adm: true } },
      diarias: { select: { valor: true } },
    },
  });

  type Celula = { valor: number; veiculoId: string | null };
  const porMotorista = new Map<string, Celula[]>();
  for (const f of faturamentos) {
    if (!f.motoristaId) continue;
    const meses = porMotorista.get(f.motoristaId) ?? Array.from({ length: 12 }, () => ({ valor: 0, veiculoId: null }));
    const base = f.lancamentos.reduce((acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)), 0);
    const diarias = f.diarias.reduce((acc, d) => acc + (d.valor ?? 0), 0);
    const cel = meses[f.mes - 1];
    cel.valor += base * COMISSAO_PERCENTUAL + diarias;
    cel.veiculoId = cel.veiculoId ?? f.veiculoId;
    porMotorista.set(f.motoristaId, meses);
  }
  const mesesVazios: Celula[] = Array.from({ length: 12 }, () => ({ valor: 0, veiculoId: null }));
  const totaisMes = Array.from({ length: 12 }, (_, i) =>
    motoristas.reduce((acc, m) => acc + (porMotorista.get(m.id)?.[i].valor ?? 0), 0)
  );
  const totalGeral = totaisMes.reduce((acc, v) => acc + v, 0);

  return (
    <div className="relatorio-impressao space-y-6">
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } }`}</style>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-500">Financeiro</p>
          <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">Faturamento</h1>
          <p className="hidden print:block text-sm text-slate-700 mt-1">
            Comissão + diárias por motorista, mês a mês · {ano} · {SITUACAO_LABEL[situacao]} · emitido em{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {motoristas.length} motorista(s) · {comPlaca} com placa vinculada
          </p>
        </div>
        <div className="no-print flex gap-2">
          <BotaoImprimir />
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

      <form className="no-print flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200">
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
        <select name="ano" defaultValue={ano} aria-label="Ano" className="input sm:w-28">
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto print:overflow-visible print:border-0 print:rounded-none">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Motorista" sortKey="nome" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              {MESES_CURTOS.map((nome) => (
                <th key={nome} className="px-3 py-3 text-right whitespace-nowrap">
                  {nome}
                </th>
              ))}
              <th className="px-4 py-3 text-right whitespace-nowrap">Total {ano}</th>
              <th className="px-4 py-3 text-right print:hidden">Faturar</th>
            </tr>
          </thead>
          <tbody>
            {motoristas.map((m) => {
              const meses = porMotorista.get(m.id) ?? mesesVazios;
              const totalMotorista = meses.reduce((acc, c) => acc + c.valor, 0);
              return (
              <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 break-inside-avoid">
                <td className="px-4 py-3">
                  <Link href={`/motoristas/${m.id}`} className="font-medium text-brand-600 hover:underline">
                    {m.nome}
                  </Link>
                </td>
                {meses.map((c, i) => (
                  <td key={i} className="px-3 py-3 text-right whitespace-nowrap text-slate-600">
                    {c.valor && c.veiculoId ? (
                      <Link
                        href={`/faturamento/${c.veiculoId}?ano=${ano}&mes=${i + 1}&motoristaId=${m.id}`}
                        className="hover:text-brand-600 hover:underline"
                      >
                        {formatCurrency(c.valor)}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-slate-900">
                  {totalMotorista ? formatCurrency(totalMotorista) : "—"}
                </td>
                <td className="px-4 py-3 text-right print:hidden">
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
              );
            })}
            {motoristas.length === 0 && (
              <tr>
                <td colSpan={15} className="px-4 py-8 text-center text-slate-400">
                  Nenhum motorista encontrado.
                </td>
              </tr>
            )}
          </tbody>
          {motoristas.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                <td className="px-4 py-3">Total ({motoristas.length})</td>
                {totaisMes.map((v, i) => (
                  <td key={i} className="px-3 py-3 text-right whitespace-nowrap">
                    {v ? formatCurrency(v) : "—"}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(totalGeral)}</td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
