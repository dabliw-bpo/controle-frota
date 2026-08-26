"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type MultaExportRow = {
  tipo: string;
  data: string;
  placa: string;
  empresa: string;
  motorista: string;
  descricao: string;
  codigoBarras: string;
  valor: number | null;
  descontarMotorista: boolean;
};

export type VencimentoExportRow = {
  data: string;
  multa: number;
  licenciamento: number;
  total: number;
  qtd: number;
};

export type AbcExportRow = {
  placa: string;
  valor: number;
  percentual: number;
  percentualAcumulado: number;
  classe: "A" | "B" | "C";
};

const HEADERS = [
  "Tipo",
  "Data",
  "Placa",
  "Empresa",
  "Motorista",
  "Descrição",
  "Código de Barras",
  "Valor",
  "Desconta do motorista",
];
const HEADERS_VENCIMENTO = ["Data de Vencimento", "Multa", "Licenciamento", "Total", "Qtd. Registros"];
const HEADERS_ABC = ["#", "Placa", "Despesa", "% do total", "% Acumulado", "Classe"];

function linhasExport(rows: MultaExportRow[]): (string | number)[][] {
  return rows.map((r) => [
    r.tipo,
    r.data,
    r.placa,
    r.empresa,
    r.motorista,
    r.descricao,
    r.codigoBarras,
    r.valor ?? 0,
    r.descontarMotorista ? "Sim" : "Não",
  ]);
}

function linhasVencimento(dados: VencimentoExportRow[]): (string | number)[][] {
  return dados.map((v) => [v.data, v.multa, v.licenciamento, v.total, v.qtd]);
}

function linhasAbc(linhas: AbcExportRow[]): (string | number)[][] {
  return linhas.map((l, i) => [
    i + 1,
    l.placa,
    l.valor,
    Number(l.percentual.toFixed(1)),
    Number(l.percentualAcumulado.toFixed(1)),
    l.classe,
  ]);
}

export default function MultasExportButtons({
  rows,
  subtitle,
  porVencimento,
  curvaAbc,
}: {
  rows: MultaExportRow[];
  subtitle: string;
  porVencimento: VencimentoExportRow[];
  curvaAbc: AbcExportRow[];
}) {
  const [gerandoExcel, setGerandoExcel] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function handleExportarExcel() {
    setGerandoExcel(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...linhasExport(rows)]);
      XLSX.utils.book_append_sheet(wb, ws, "Multas");

      const wsVencimento = XLSX.utils.aoa_to_sheet([HEADERS_VENCIMENTO, ...linhasVencimento(porVencimento)]);
      XLSX.utils.book_append_sheet(wb, wsVencimento, "Por Vencimento");

      const wsAbc = XLSX.utils.aoa_to_sheet([HEADERS_ABC, ...linhasAbc(curvaAbc)]);
      XLSX.utils.book_append_sheet(wb, wsAbc, "Curva ABC");

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
          row.map((v, i) => (i === 7 && typeof v === "number" ? formatCurrency(v) : v))
        ),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("Total por Data de Vencimento", 14, 15);

      autoTable(doc, {
        startY: 20,
        head: [HEADERS_VENCIMENTO],
        body: porVencimento.map((v) => [
          v.data,
          formatCurrency(v.multa),
          formatCurrency(v.licenciamento),
          formatCurrency(v.total),
          v.qtd,
        ]),
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("Curva ABC de Placas por Despesa", 14, 15);

      autoTable(doc, {
        startY: 20,
        head: [HEADERS_ABC],
        body: linhasAbc(curvaAbc).map((row) =>
          row.map((v, i) => (i === 2 && typeof v === "number" ? formatCurrency(v) : i === 3 || i === 4 ? `${v}%` : v))
        ),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 5) {
            const classe = data.cell.raw;
            if (classe === "A") data.cell.styles.textColor = [185, 28, 28];
            else if (classe === "B") data.cell.styles.textColor = [180, 83, 9];
            else data.cell.styles.textColor = [100, 116, 139];
            data.cell.styles.fontStyle = "bold";
          }
        },
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
