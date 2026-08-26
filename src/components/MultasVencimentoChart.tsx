import { formatCurrency } from "@/lib/format";

export type VencimentoAgg = { data: string; multa: number; licenciamento: number; total: number; qtd: number };

export default function MultasVencimentoChart({ dados }: { dados: VencimentoAgg[] }) {
  if (dados.length === 0) return <p className="text-sm text-slate-400">Nenhum registro.</p>;
  const max = Math.max(...dados.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      {dados.map((d) => (
        <div key={d.data}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{d.data}</span>
            <span className="text-slate-600">
              {formatCurrency(d.total)} <span className="text-slate-400">({d.qtd})</span>
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {d.multa > 0 && (
              <div
                className="h-full bg-red-400"
                style={{ width: `${(d.multa / max) * 100}%` }}
                title={`Multa: ${formatCurrency(d.multa)}`}
              />
            )}
            {d.licenciamento > 0 && (
              <div
                className="h-full bg-blue-400"
                style={{ width: `${(d.licenciamento / max) * 100}%` }}
                title={`Licenciamento: ${formatCurrency(d.licenciamento)}`}
              />
            )}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Multa
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Licenciamento
        </span>
      </div>
    </div>
  );
}
