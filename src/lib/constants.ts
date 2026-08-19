export const ROLES = ["ADMIN", "GESTOR", "VISUALIZADOR"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  VISUALIZADOR: "Visualizador",
};

// Status ocultados do painel (a lista completa de status agora é gerenciada
// em /configuracoes/status, ver src/lib/settings.ts)
export const STATUS_VEICULO_OUTRO_MENU = ["ALUGADO", "VENDIDO"] as const;

export const MESES_REFERENCIA = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;
