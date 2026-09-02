"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";

export type FaturamentoExportRow = {
  placa: string;
  motorista: string;
  frete: number;
  abastecimento: number;
  comissao: number;
  diarias: number;
  lucro: number;
  margem: number;
};

const HEADERS = ["Placa", "Motorista", "Vlr. Frete", "Abastecimento", "Comissão", "Diárias", "Lucro", "Margem"];

export default function DashboardFaturamentoExport({
  linhas,
  totais,
  margemMedia,
  mesNome,
  ano,
}: {
  linhas: FaturamentoExportRow[];
  totais: { frete: number; abastecimento: number; comissao: number; diarias: number; lucro: number };
  margemMedia: number;
  mesNome: string;
  ano: number;
}) {
  const [gerando, setGerando] = useState(false);

  async function handleExportar() {
    setGerando(true);
    try {
      const XLSX = await import("xlsx");
      const rows = [
        HEADERS,
        ...linhas.map((l) => [
          l.placa,
          l.motorista,
          l.frete,
          l.abastecimento,
          l.comissao,
          l.diarias,
          l.lucro,
          Number((l.margem * 100).toFixed(1)),
        ]),
        [
          `Total (${linhas.length})`,
          "",
          totais.frete,
          totais.abastecimento,
          totais.comissao,
          totais.diarias,
          totais.lucro,
          Number((margemMedia * 100).toFixed(1)),
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Faturamento");
      XLSX.writeFile(wb, `faturamento-painel-${mesNome.toLowerCase()}-${ano}.xlsx`);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExportar}
      disabled={gerando}
      className="inline-flex items-center gap-1.5 bg-success-600 hover:bg-success-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 h-[38px]"
    >
      <FileSpreadsheet size={16} strokeWidth={2} />
      {gerando ? "Gerando..." : "Exportar Excel"}
    </button>
  );
}
