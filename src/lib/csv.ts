function formatNumero(n: number): string {
  // Arredonda para 2 casas e usa vírgula decimal (padrão Excel pt-BR), evitando
  // lixo de ponto flutuante como 9723.415199999998.
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2).replace(".", ",");
}

function escapeCsvCell(value: unknown): string {
  const s = typeof value === "number" ? formatNumero(value) : value === null || value === undefined ? "" : String(value);
  // O delimitador do arquivo é ";", então só precisamos escapar aspas, o próprio
  // delimitador e quebras de linha — não a vírgula, que aqui é decimal (pt-BR).
  if (/["\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const linhas = [headers, ...rows].map((linha) => linha.map(escapeCsvCell).join(";"));
  return "﻿" + linhas.join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
