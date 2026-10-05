export type PieSlice = { label: string; value: number; color: string };

// Paleta categórica usada quando o dado não tem cor própria (tipo, empresa).
export const PIE_PALETTE = [
  "#6e5a35", // bronze (destaque)
  "#3d6b37", // verde (sucesso)
  "#c9a96e", // dourado claro
  "#b3432a", // terracota (erro)
  "#57524a", // cinza quente
  "#8a7d5c", // oliva
  "#7f9a6b", // sálvia
  "#d4a373", // areia
  "#9c6b4e", // cobre
  "#a8a196", // pedra
  "#4f4026", // bronze escuro
  "#c4553b", // ferrugem
];

// Mapeia o nome de cor usado nos badges de status (COR_PALETA) para um hex,
// mantendo o gráfico e o badge com a mesma cor.
const STATUS_COR_HEX: Record<string, string> = {
  gray: "#9ca3af",
  slate: "#64748b",
  emerald: "#10b981",
  blue: "#3b82f6",
  amber: "#f59e0b",
  purple: "#a855f7",
  red: "#ef4444",
  orange: "#f97316",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  cyan: "#06b6d4",
};

export function corNomeParaHex(cor: string | null | undefined): string {
  return STATUS_COR_HEX[cor ?? ""] ?? STATUS_COR_HEX.gray;
}

export default function PieChart({ data, size = 140 }: { data: PieSlice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="text-sm text-slate-400">Nenhum registro.</p>;

  const strokeWidth = size * 0.28;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 -rotate-90"
        role="img"
        aria-label="Gráfico de pizza"
      >
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const offset = -(cumulative / total) * circumference;
          cumulative += d.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <ul className="flex-1 w-full space-y-1.5 text-sm min-w-0">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="text-slate-600 truncate">{d.label}</span>
            </span>
            <span className="font-medium text-slate-700 shrink-0">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
