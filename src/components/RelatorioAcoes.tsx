"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";

export type RelatorioPdfConfig = {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  foot?: (string | number)[][];
};

export default function RelatorioAcoes({
  exportHref,
  pdf,
}: {
  exportHref: string;
  pdf: RelatorioPdfConfig;
}) {
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function handlePdf() {
    setGerandoPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(pdf.title, 14, 15);

      let startY = 20;
      if (pdf.subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(pdf.subtitle, 14, 21);
        startY = 26;
      }

      autoTable(doc, {
        startY,
        head: [pdf.headers],
        body: pdf.rows,
        foot: pdf.foot,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(pdf.filename);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <a
        href={exportHref}
        className="inline-flex items-center gap-1.5 bg-success-600 hover:bg-success-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
      >
        <FileSpreadsheet size={16} strokeWidth={2} />
        Exportar CSV
      </a>
      <button
        type="button"
        onClick={handlePdf}
        disabled={gerandoPdf}
        className="inline-flex items-center gap-1.5 bg-danger-600 hover:bg-danger-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2.5"
      >
        <FileText size={16} strokeWidth={2} />
        {gerandoPdf ? "Gerando..." : "Exportar PDF"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
      >
        <Printer size={16} strokeWidth={2} />
        Imprimir
      </button>
    </div>
  );
}
