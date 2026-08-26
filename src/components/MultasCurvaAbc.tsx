import { formatCurrency } from "@/lib/format";

export type AbcRow = {
  placa: string;
  valor: number;
  percentual: number;
  percentualAcumulado: number;
  classe: "A" | "B" | "C";
};

const CLASSE_COLOR: Record<"A" | "B" | "C", string> = { A: "#ef4444", B: "#f59e0b", C: "#94a3b8" };
const CLASSE_BADGE: Record<"A" | "B" | "C", string> = {
  A: "bg-red-100 text-red-800",
  B: "bg-amber-100 text-amber-800",
  C: "bg-slate-100 text-slate-600",
};

export default function MultasCurvaAbc({ linhas }: { linhas: AbcRow[] }) {
  if (linhas.length === 0) return <p className="text-sm text-slate-400">Nenhum registro.</p>;

  const barWidth = 22;
  const gap = 6;
  const chartBottom = 160;
  const chartHeight = chartBottom;
  const width = Math.max(linhas.length * (barWidth + gap) + gap, 320);
  const maxValor = Math.max(...linhas.map((l) => l.valor), 1);

  const pontos = linhas.map((l, i) => {
    const x = gap + i * (barWidth + gap) + barWidth / 2;
    const y = chartBottom - (l.percentualAcumulado / 100) * chartHeight;
    return { x, y };
  });

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <svg width={width} height={chartBottom + 20} role="img" aria-label="Curva ABC de placas por despesa">
          {[80, 95].map((marca) => {
            const y = chartBottom - (marca / 100) * chartHeight;
            return (
              <g key={marca}>
                <line x1={0} x2={width} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 3" />
                <text x={width - 2} y={y - 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                  {marca}%
                </text>
              </g>
            );
          })}
          {linhas.map((l, i) => {
            const x = gap + i * (barWidth + gap);
            const h = (l.valor / maxValor) * chartHeight;
            return (
              <rect key={l.placa} x={x} y={chartBottom - h} width={barWidth} height={h} fill={CLASSE_COLOR[l.classe]} rx="2">
                <title>{`${l.placa}: ${formatCurrency(l.valor)} (classe ${l.classe})`}</title>
              </rect>
            );
          })}
          <polyline
            points={pontos.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#0f172a"
            strokeWidth="1.75"
          />
          {pontos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.25" fill="#0f172a" />
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Classe A (até 80%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Classe B (80–95%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Classe C (95–100%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 border-t-2 border-slate-900" /> % acumulado
        </span>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Placa</th>
              <th className="px-3 py-2 font-medium">Despesa</th>
              <th className="px-3 py-2 font-medium">% do total</th>
              <th className="px-3 py-2 font-medium">% acumulado</th>
              <th className="px-3 py-2 font-medium">Classe</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.placa} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                <td className="px-3 py-1.5 font-medium text-slate-800">{l.placa}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{formatCurrency(l.valor)}</td>
                <td className="px-3 py-1.5 text-slate-600">{l.percentual.toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-slate-600">{l.percentualAcumulado.toFixed(1)}%</td>
                <td className="px-3 py-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSE_BADGE[l.classe]}`}
                  >
                    {l.classe}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
