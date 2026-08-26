import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import SortableTh from "@/components/SortableTh";
import MultasExportButtons from "@/components/MultasExportButtons";
import MultasVencimentoChart from "@/components/MultasVencimentoChart";
import MultasCurvaAbc from "@/components/MultasCurvaAbc";

const SORT_FIELDS = ["placa", "motorista", "data"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "data";
  if (field === "placa") return { veiculo: { placa: dir } } as const;
  if (field === "motorista") return { motorista: { nome: dir } } as const;
  // "data" é um texto livre dd/mm/aaaa (não um Date real no banco), então não dá
  // para ordenar corretamente via SQL — buscamos por criação e reordenamos em JS abaixo.
  return { createdAt: dir } as const;
}

// Converte "dd/mm/aaaa" em um número comparável (aaaammdd); retorna null se vazio/inválido.
function parseDataBr(data: string | null): number | null {
  const m = data?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  return Number(aaaa) * 10000 + Number(mm) * 100 + Number(dd);
}

function compareData(a: { data: string | null }, b: { data: string | null }, mult: 1 | -1): number {
  const da = parseDataBr(a.data);
  const db = parseDataBr(b.data);
  if (da === null && db === null) return 0;
  if (da === null) return 1; // datas ausentes/ inválidas sempre por último
  if (db === null) return -1;
  return mult * (da - db);
}

export default async function MultasPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; dir?: string; tipo?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";
  const tipo = searchParams.tipo === "MULTA" || searchParams.tipo === "LICENCIAMENTO" ? searchParams.tipo : "";

  let multas = await prisma.multa.findMany({
    where: {
      ...(tipo ? { tipo } : {}),
      ...(q
        ? {
            OR: [
              { veiculo: { placa: { contains: q, mode: "insensitive" } } },
              { veiculo: { empresa: { nome: { contains: q, mode: "insensitive" } } } },
              { veiculo: { responsavelTexto: { contains: q, mode: "insensitive" } } },
              { motorista: { nome: { contains: q, mode: "insensitive" } } },
              { descricao: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { veiculo: { include: { empresa: true } }, motorista: true },
    orderBy: getOrderBy(searchParams.sort, dir),
  });

  const sortField: SortField = SORT_FIELDS.includes(searchParams.sort as SortField)
    ? (searchParams.sort as SortField)
    : "data";
  if (sortField === "data") {
    const mult = dir === "asc" ? 1 : -1;
    multas = [...multas].sort((a, b) => compareData(a, b, mult));
  }

  const multasDoTipo = multas.filter((m) => m.tipo === "MULTA");
  const licenciamentosDoTipo = multas.filter((m) => m.tipo === "LICENCIAMENTO");
  const somaMultas = multasDoTipo.reduce((acc, m) => acc + (m.valor ?? 0), 0);
  const somaLicenciamentos = licenciamentosDoTipo.reduce((acc, m) => acc + (m.valor ?? 0), 0);
  const totalMultas = multasDoTipo.length;
  const totalLicenciamentos = licenciamentosDoTipo.length;
  const totalDescontar = multas.filter((m) => m.descontarMotorista).length;
  const subtitle = `${totalMultas} multa(s) · ${totalLicenciamentos} licenciamento(s) · ${totalDescontar} a descontar do motorista`;
  const exportRows = multas.map((m) => ({
    tipo: m.tipo === "LICENCIAMENTO" ? "Licenciamento" : "Multa",
    data: m.data || "—",
    placa: m.veiculo.placa,
    empresa: m.veiculo.empresa?.nome ?? m.veiculo.responsavelTexto ?? "—",
    motorista: m.motorista?.nome ?? "—",
    descricao: m.descricao,
    codigoBarras: m.codigoBarras || "—",
    valor: m.valor,
    descontarMotorista: m.descontarMotorista,
  }));

  // Dashboard: soma dos totais por data de vencimento.
  const porVencimentoMap = new Map<string, { data: string; multa: number; licenciamento: number; qtd: number }>();
  for (const m of multas) {
    const chave = m.data || "Sem data";
    const atual = porVencimentoMap.get(chave) ?? { data: chave, multa: 0, licenciamento: 0, qtd: 0 };
    const valor = m.valor ?? 0;
    if (m.tipo === "MULTA") atual.multa += valor;
    else atual.licenciamento += valor;
    atual.qtd += 1;
    porVencimentoMap.set(chave, atual);
  }
  const porVencimento = Array.from(porVencimentoMap.values())
    .map((v) => ({ ...v, total: v.multa + v.licenciamento }))
    .sort((a, b) => {
      const da = parseDataBr(a.data);
      const db = parseDataBr(b.data);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });

  // Dashboard: curva ABC de placas por despesa total (multa + licenciamento).
  const porPlacaMap = new Map<string, number>();
  for (const m of multas) {
    const placa = m.veiculo.placa;
    porPlacaMap.set(placa, (porPlacaMap.get(placa) ?? 0) + (m.valor ?? 0));
  }
  const totalGeralValor = Array.from(porPlacaMap.values()).reduce((acc, v) => acc + v, 0);
  let acumulado = 0;
  const curvaAbc = Array.from(porPlacaMap.entries())
    .map(([placa, valor]) => ({ placa, valor }))
    .sort((a, b) => b.valor - a.valor)
    .map((p) => {
      const acumuladoAntes = acumulado;
      acumulado += p.valor;
      const percentual = totalGeralValor > 0 ? (p.valor / totalGeralValor) * 100 : 0;
      const percentualAcumulado = totalGeralValor > 0 ? (acumulado / totalGeralValor) * 100 : 0;
      const percentualAntes = totalGeralValor > 0 ? (acumuladoAntes / totalGeralValor) * 100 : 0;
      const classe: "A" | "B" | "C" = percentualAntes < 80 ? "A" : percentualAntes < 95 ? "B" : "C";
      return { placa: p.placa, valor: p.valor, percentual, percentualAcumulado, classe };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multas de Trânsito</h1>
          <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MultasExportButtons rows={exportRows} subtitle={subtitle} porVencimento={porVencimento} curvaAbc={curvaAbc} />
          <Link
            href="/multas/novo"
            className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nova multa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Total por data de vencimento</h2>
          <MultasVencimentoChart dados={porVencimento} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Curva ABC de placas por despesa</h2>
          <MultasCurvaAbc linhas={curvaAbc} />
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
        <select name="tipo" defaultValue={tipo} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Todos os tipos</option>
          <option value="MULTA">Multa</option>
          <option value="LICENCIAMENTO">Licenciamento</option>
        </select>
        <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <SortableTh label="Data" sortKey="data" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Placa" sortKey="placa" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <th className="px-4 py-3 font-medium">Empresa</th>
              <SortableTh label="Motorista" sortKey="motorista" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Código de Barras</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
            </tr>
          </thead>
          <tbody>
            {multas.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  {m.tipo === "LICENCIAMENTO" ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      Licenciamento
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                      Multa
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.data || "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/multas/${m.id}`} className="font-medium text-brand-600 hover:underline">
                    {m.veiculo.placa}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.veiculo.empresa?.nome ?? m.veiculo.responsavelTexto ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{m.motorista?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[320px] truncate" title={m.descricao}>
                  {m.descricao}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                  {m.codigoBarras || "—"}
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
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
          {multas.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 text-slate-700 border-t border-slate-200">
                <td className="px-4 py-2.5" colSpan={7}>
                  Total de multas ({totalMultas})
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap font-medium">{formatCurrency(somaMultas)}</td>
                <td></td>
              </tr>
              <tr className="bg-slate-50 text-slate-700 border-t border-slate-100">
                <td className="px-4 py-2.5" colSpan={7}>
                  Total de licenciamentos ({totalLicenciamentos})
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap font-medium">{formatCurrency(somaLicenciamentos)}</td>
                <td></td>
              </tr>
              <tr className="bg-slate-100 font-semibold text-slate-900 border-t border-slate-200">
                <td className="px-4 py-3" colSpan={7}>
                  Total geral ({multas.length})
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(somaMultas + somaLicenciamentos)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
