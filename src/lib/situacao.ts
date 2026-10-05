export type SituacaoMotorista = "ativos" | "inativos" | "todos";

export function parseSituacao(v: string | undefined): SituacaoMotorista {
  return v === "inativos" || v === "todos" ? v : "ativos";
}

export function situacaoWhere(situacao: SituacaoMotorista): { ativo?: boolean } {
  if (situacao === "todos") return {};
  return { ativo: situacao === "ativos" };
}
