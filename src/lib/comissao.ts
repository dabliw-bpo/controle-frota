export const COMISSAO_PADRAO = 12;

export type VigenciaComissao = { ano: number; mes: number; percentual: number };

// Percentual vigente no mês: o registro mais recente com início <= ano/mes.
export function percentualVigente(vigencias: VigenciaComissao[] | undefined, ano: number, mes: number): number {
  const alvo = ano * 12 + mes;
  let escolhido: VigenciaComissao | null = null;
  for (const v of vigencias ?? []) {
    const inicio = v.ano * 12 + v.mes;
    if (inicio <= alvo && (!escolhido || inicio > escolhido.ano * 12 + escolhido.mes)) escolhido = v;
  }
  return escolhido ? escolhido.percentual : COMISSAO_PADRAO;
}

export function fatorComissao(percentual: number | null | undefined): number {
  return (percentual ?? COMISSAO_PADRAO) / 100;
}

export function formatPercentual(percentual: number | null | undefined): string {
  return String(percentual ?? COMISSAO_PADRAO).replace(".", ",");
}
