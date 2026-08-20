"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Save, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { salvarFaturamento, type LancamentoInput } from "@/app/(app)/faturamento/actions";
import { formatCurrency } from "@/lib/format";

type LinhaEditavel = {
  data: string;
  placa: string;
  descricao: string;
  cte: string;
  vlrFrete: string;
  despesas: string;
  abastecimento: string;
  pedagio: string;
  seguro: string;
  adm: string;
};

const COMISSAO_PERCENTUAL = 0.12;

function linhaVazia(placaPadrao: string): LinhaEditavel {
  return {
    data: "",
    placa: placaPadrao,
    descricao: "",
    cte: "",
    vlrFrete: "",
    despesas: "",
    abastecimento: "",
    pedagio: "",
    seguro: "",
    adm: "",
  };
}

function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

export default function FaturamentoEditor({
  veiculoId,
  ano,
  mes,
  mesNome,
  placa,
  motoristaNome,
  motoristaId,
  lancamentosIniciais,
}: {
  veiculoId: string;
  ano: number;
  mes: number;
  mesNome: string;
  placa: string;
  motoristaNome: string | null;
  motoristaId: string | null;
  lancamentosIniciais: {
    data: string | null;
    placa?: string | null;
    descricao: string | null;
    cte: string | null;
    vlrFrete: number | null;
    despesas: number | null;
    abastecimento: number | null;
    pedagio: number | null;
    seguro: number | null;
    adm: number | null;
  }[];
}) {
  const [linhas, setLinhas] = useState<LinhaEditavel[]>(() => {
    const iniciais = lancamentosIniciais.map((l) => ({
      data: l.data ?? "",
      placa: l.placa ?? placa,
      descricao: l.descricao ?? "",
      cte: l.cte ?? "",
      vlrFrete: l.vlrFrete != null ? String(l.vlrFrete) : "",
      despesas: l.despesas != null ? String(l.despesas) : "",
      abastecimento: l.abastecimento != null ? String(l.abastecimento) : "",
      pedagio: l.pedagio != null ? String(l.pedagio) : "",
      seguro: l.seguro != null ? String(l.seguro) : "",
      adm: l.adm != null ? String(l.adm) : "",
    }));
    return iniciais.length ? iniciais : [linhaVazia(placa)];
  });
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState("");
  const [gerandoExcel, setGerandoExcel] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  function atualizarCelula(idx: number, campo: keyof LinhaEditavel, valor: string) {
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }

  function adicionarLinha() {
    setLinhas((prev) => [...prev, linhaVazia(placa)]);
  }

  function removerLinha(idx: number) {
    setLinhas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : [linhaVazia(placa)]));
  }

  const calculadas = useMemo(
    () =>
      linhas.map((l) => {
        const vlrFrete = num(l.vlrFrete);
        const seguro = num(l.seguro);
        const adm = num(l.adm);
        const base = vlrFrete - seguro - adm;
        const comissao = base * COMISSAO_PERCENTUAL;
        return { vlrFrete, despesas: num(l.despesas), abastecimento: num(l.abastecimento), pedagio: num(l.pedagio), seguro, adm, base, comissao };
      }),
    [linhas]
  );

  const totais = useMemo(
    () =>
      calculadas.reduce(
        (acc, c) => ({
          vlrFrete: acc.vlrFrete + c.vlrFrete,
          despesas: acc.despesas + c.despesas,
          abastecimento: acc.abastecimento + c.abastecimento,
          pedagio: acc.pedagio + c.pedagio,
          seguro: acc.seguro + c.seguro,
          adm: acc.adm + c.adm,
          base: acc.base + c.base,
          comissao: acc.comissao + c.comissao,
        }),
        { vlrFrete: 0, despesas: 0, abastecimento: 0, pedagio: 0, seguro: 0, adm: 0, base: 0, comissao: 0 }
      ),
    [calculadas]
  );

  const headersExport = [
    "Data",
    "Placa",
    "Descrição",
    "CTE",
    "Vlr. Frete",
    "Despesas",
    "Abastecimento",
    "Pedágio",
    "Seguro",
    "ADM",
    "Base comissão",
    "Comissão 12%",
  ];

  function linhasExport(): (string | number)[][] {
    return linhas.map((l, idx) => [
      l.data,
      l.placa,
      l.descricao,
      l.cte,
      calculadas[idx].vlrFrete,
      calculadas[idx].despesas,
      calculadas[idx].abastecimento,
      calculadas[idx].pedagio,
      calculadas[idx].seguro,
      calculadas[idx].adm,
      calculadas[idx].base,
      calculadas[idx].comissao,
    ]);
  }

  function tituloExport() {
    return `Faturamento — ${placa}${motoristaNome ? ` — ${motoristaNome}` : ""} — ${mesNome}/${ano}`;
  }

  function nomeArquivoExport() {
    return `faturamento-${placa}-${mes}-${ano}`.toLowerCase();
  }

  async function handleExportarExcel() {
    setGerandoExcel(true);
    try {
      const XLSX = await import("xlsx");
      const rows = [headersExport, ...linhasExport(), [
        `Total (${linhas.length} lançamento${linhas.length === 1 ? "" : "s"})`,
        "",
        "",
        "",
        totais.vlrFrete,
        totais.despesas,
        totais.abastecimento,
        totais.pedagio,
        totais.seguro,
        totais.adm,
        totais.base,
        totais.comissao,
      ]];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Faturamento");
      XLSX.writeFile(wb, `${nomeArquivoExport()}.xlsx`);
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
      doc.text(tituloExport(), 14, 15);

      autoTable(doc, {
        startY: 20,
        head: [headersExport],
        body: linhasExport().map((row) =>
          row.map((v) => (typeof v === "number" ? formatCurrency(v) : v))
        ),
        foot: [
          [
            `Total (${linhas.length} lançamento${linhas.length === 1 ? "" : "s"})`,
            "",
            "",
            "",
            formatCurrency(totais.vlrFrete),
            formatCurrency(totais.despesas),
            formatCurrency(totais.abastecimento),
            formatCurrency(totais.pedagio),
            formatCurrency(totais.seguro),
            formatCurrency(totais.adm),
            formatCurrency(totais.base),
            formatCurrency(totais.comissao),
          ],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${nomeArquivoExport()}.pdf`);
    } finally {
      setGerandoPdf(false);
    }
  }

  function handleSalvar() {
    const lancamentos: LancamentoInput[] = linhas.map((l) => ({
      data: l.data.trim() || null,
      placa: l.placa.trim() || null,
      descricao: l.descricao.trim() || null,
      cte: l.cte.trim() || null,
      vlrFrete: l.vlrFrete.trim() ? num(l.vlrFrete) : null,
      despesas: l.despesas.trim() ? num(l.despesas) : null,
      abastecimento: l.abastecimento.trim() ? num(l.abastecimento) : null,
      pedagio: l.pedagio.trim() ? num(l.pedagio) : null,
      seguro: l.seguro.trim() ? num(l.seguro) : null,
      adm: l.adm.trim() ? num(l.adm) : null,
    }));

    startTransition(async () => {
      await salvarFaturamento({ veiculoId, ano, mes, motoristaId, lancamentos });
      setMensagem("Salvo com sucesso.");
      setTimeout(() => setMensagem(""), 2500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 font-medium min-w-[110px]">Data</th>
              <th className="px-3 py-2 font-medium min-w-[100px]">Placa</th>
              <th className="px-3 py-2 font-medium min-w-[220px]">Descrição</th>
              <th className="px-3 py-2 font-medium min-w-[100px]">CTE</th>
              <th className="px-3 py-2 font-medium min-w-[130px]">Vlr. Frete</th>
              <th className="px-3 py-2 font-medium min-w-[110px]">Despesas</th>
              <th className="px-3 py-2 font-medium min-w-[130px]">Abastecimento</th>
              <th className="px-3 py-2 font-medium min-w-[100px]">Pedágio</th>
              <th className="px-3 py-2 font-medium min-w-[100px]">Seguro</th>
              <th className="px-3 py-2 font-medium min-w-[90px]">ADM</th>
              <th className="px-3 py-2 font-medium min-w-[130px] text-slate-700">Base comissão</th>
              <th className="px-3 py-2 font-medium min-w-[110px] text-slate-700">Comissão 12%</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0">
                <Cell value={l.data} onChange={(v) => atualizarCelula(idx, "data", v)} placeholder="dd/mm/aaaa" />
                <Cell value={l.placa} onChange={(v) => atualizarCelula(idx, "placa", v.toUpperCase())} placeholder={placa} />
                <Cell value={l.descricao} onChange={(v) => atualizarCelula(idx, "descricao", v)} placeholder="Origem X Destino" />
                <Cell value={l.cte} onChange={(v) => atualizarCelula(idx, "cte", v)} />
                <Cell value={l.vlrFrete} onChange={(v) => atualizarCelula(idx, "vlrFrete", v)} numeric />
                <Cell value={l.despesas} onChange={(v) => atualizarCelula(idx, "despesas", v)} numeric />
                <Cell value={l.abastecimento} onChange={(v) => atualizarCelula(idx, "abastecimento", v)} numeric />
                <Cell value={l.pedagio} onChange={(v) => atualizarCelula(idx, "pedagio", v)} numeric />
                <Cell value={l.seguro} onChange={(v) => atualizarCelula(idx, "seguro", v)} numeric />
                <Cell value={l.adm} onChange={(v) => atualizarCelula(idx, "adm", v)} numeric />
                <td className="px-3 py-1 text-slate-700 font-medium whitespace-nowrap">
                  {formatCurrency(calculadas[idx].base)}
                </td>
                <td className="px-3 py-1 text-slate-700 font-medium whitespace-nowrap">
                  {formatCurrency(calculadas[idx].comissao)}
                </td>
                <td className="px-2 py-1 text-right">
                  <button
                    type="button"
                    onClick={() => removerLinha(idx)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-danger-500 hover:bg-danger-50 hover:text-danger-600"
                    title="Remover linha"
                    aria-label="Remover linha"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
              <td className="px-3 py-2" colSpan={4}>
                Total ({linhas.length} lançamento{linhas.length === 1 ? "" : "s"})
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.vlrFrete)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.despesas)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.abastecimento)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.pedagio)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.seguro)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.adm)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.base)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(totais.comissao)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={adicionarLinha}
          className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2.5"
        >
          <Plus size={16} strokeWidth={2.5} />
          Adicionar linha
        </button>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2.5"
        >
          <Save size={16} strokeWidth={2} />
          {isPending ? "Salvando..." : "Salvar faturamento"}
        </button>
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
        {mensagem && <span className="text-sm text-success-600 font-medium">{mensagem}</span>}
      </div>
    </div>
  );
}

function Cell({
  value,
  onChange,
  placeholder,
  numeric,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
}) {
  return (
    <td className="px-1 py-1">
      <input
        type={numeric ? "number" : "text"}
        step={numeric ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </td>
  );
}
