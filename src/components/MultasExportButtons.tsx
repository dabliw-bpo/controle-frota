"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type MultaExportRow = {
  data: string;
  placa: string;
  motorista: string;
  descricao: string;
  valor: number | null;
  descontarMotorista: boolean;
};

const HEADERS = ["Data", "Placa", "Motorista", "Descrição", "Valor", "Desconta do motorista"];

function linhasExport(rows: MultaExportRow[]): (string | number)[][] {
  return rows.map((r) => [
    r.data,
    r.placa,
    r.motorista,
    r.descricao,
    r.valor ?? 0,
    r.descontarMotorista ? "Sim" : "Não",
  ]);
}

export default function MultasExportButtons({
  rows,
  subtitle,
}: {
  rows: MultaExportRow[];
  subtitle: string;
}) {
  const [gerandoExcel, setGerandoExcel] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function handleExportarExcel() {
    setGerandoExcel(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...linhasExport(rows)]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Multas");
      XLSX.writeFile(wb, "multas-de-transito.xlsx");
    } finally {
      setGerandoExcel(false);
    }
  }

  async function handleExportarPdf() {
    setGerandoPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Multas de Trânsito", 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitle, 14, 21);

      autoTable(doc, {
        startY: 26,
        head: [HEADERS],
        body: linhasExport(rows).map((row) =>
          row.map((v, i) => (i === 4 && typeof v === "number" ? formatCurrency(v) : v))
        ),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save("multas-de-transito.pdf");
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleExportarExcel}
        disabled={gerandoExcel}
        className="inline-flex items-center gap-1.5 bg-success-600 hover:bg-success-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2.5"
      >
        <FileSpreadsheet size={16} strokeWidth={2} />
        {gerandoExcel ? "Gerando..." : "Exportar Excel"}
      </button>
      <button
        type="button"
        onClick={handleExportarPdf}
        disabled={gerandoPdf}
        className="inline-flex items-center gap-1.5 bg-danger-600 hover:bg-danger-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2.5"
      >
        <FileText size={16} strokeWidth={2} />
        {gerandoPdf ? "Gerando..." : "Exportar PDF"}
      </button>
    </div>
  );
}
