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
      doc.setTextColor(31, 29, 25);
      doc.text(pdf.title, 14, 15);

      let startY = 20;
      if (pdf.subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(87, 82, 74);
        doc.text(pdf.subtitle, 14, 21);
        startY = 26;
      }

      autoTable(doc, {
        startY,
        head: [pdf.headers],
        body: pdf.rows,
        foot: pdf.foot,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [110, 90, 53], textColor: 255 },
        footStyles: { fillColor: [241, 239, 234], textColor: [31, 29, 25], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 245, 242] },
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
        className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-brand-500 hover:text-brand-600 text-slate-900 text-sm font-medium rounded-lg px-4 py-2.5"
      >
        <FileSpreadsheet size={16} strokeWidth={2} />
        Exportar CSV
      </a>
      <button
        type="button"
        onClick={handlePdf}
        disabled={gerandoPdf}
        className="inline-flex items-center gap-1.5 border border-slate-300 hover:border-brand-500 hover:text-brand-600 disabled:opacity-60 text-slate-900 text-sm font-medium rounded-lg px-4 py-2.5"
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
