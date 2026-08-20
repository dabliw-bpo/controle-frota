export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumberInput(value?: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function nomesMotoristas(
  motoristas: { nome: string }[],
  fallback?: string | null
): string {
  if (motoristas.length === 0) return fallback ?? "—";
  return motoristas.map((m) => m.nome).join(", ");
}

// Lista (sem repetição) das placas realmente usadas nos lançamentos de um
// faturamento mensal; cai para a placa do veículo quando nenhum lançamento
// tem placa própria informada (ex: registros antigos).
export function placasUtilizadas(
  lancamentos: { placa?: string | null }[],
  placaPadrao: string
): string {
  const set = new Set(
    lancamentos.map((l) => (l.placa || "").trim().toUpperCase()).filter(Boolean)
  );
  if (set.size === 0) return placaPadrao;
  return Array.from(set).sort().join(", ");
}
