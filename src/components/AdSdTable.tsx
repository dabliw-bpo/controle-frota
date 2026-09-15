"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export type CteLinha = {
  id: string;
  data: string | null;
  cte: string | null;
  placa: string | null;
  motoristaNome: string | null;
  veiculoId: string;
  ano: number;
  mes: number;
  vlrFrete: number;
  baseComissao: number;
  ad: number;
  dataRecebAd: string | null;
  sd: number;
  dataRecebSd: string | null;
};

type LinhaCliente = {
  clienteId: string;
  clienteNome: string;
  baseComissao: number;
  ad: number;
  dataRecebAd: string;
  sd: number;
  dataRecebSd: string;
  ctes: CteLinha[];
};

export default function AdSdTable({
  linhas,
  totais,
}: {
  linhas: LinhaCliente[];
  totais: { baseComissao: number; ad: number; sd: number };
}) {
  const [clienteAberto, setClienteAberto] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Base Comissão</th>
            <th className="px-4 py-3 font-medium">AD</th>
            <th className="px-4 py-3 font-medium">Data Receb. AD</th>
            <th className="px-4 py-3 font-medium">SD</th>
            <th className="px-4 py-3 font-medium">Data Receb. SD</th>
            <th className="px-4 py-3 font-medium">Total AD + SD</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const aberto = clienteAberto === l.clienteId;
            const pendentes = l.ctes.filter((c) => (c.ad > 0 && !c.dataRecebAd) || (c.sd > 0 && !c.dataRecebSd)).length;
            return (
              <Fragment key={l.clienteId}>
                <tr
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setClienteAberto(aberto ? null : l.clienteId)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      {aberto ? (
                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400 shrink-0" />
                      )}
                      {l.clienteNome}
                      <span className="text-xs text-slate-400">
                        ({l.ctes.length} CT-e{l.ctes.length === 1 ? "" : "s"})
                      </span>
                      {pendentes > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <AlertTriangle size={11} />
                          {pendentes} a cobrar
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.baseComissao)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.ad)}</td>
                  <td className="px-4 py-3 text-slate-600">{l.dataRecebAd}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.sd)}</td>
                  <td className="px-4 py-3 text-slate-600">{l.dataRecebSd}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{formatCurrency(l.ad + l.sd)}</td>
                </tr>
                {aberto && (
                  <tr>
                    <td colSpan={7} className="bg-slate-50 px-4 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="px-2 py-2 font-medium">Data</th>
                            <th className="px-2 py-2 font-medium">CT-e</th>
                            <th className="px-2 py-2 font-medium">Placa</th>
                            <th className="px-2 py-2 font-medium">Motorista</th>
                            <th className="px-2 py-2 font-medium">Vlr. Frete</th>
                            <th className="px-2 py-2 font-medium">Base Comissão</th>
                            <th className="px-2 py-2 font-medium">AD</th>
                            <th className="px-2 py-2 font-medium">Data Receb. AD</th>
                            <th className="px-2 py-2 font-medium">SD</th>
                            <th className="px-2 py-2 font-medium">Data Receb. SD</th>
                            <th className="px-2 py-2 font-medium">Situação</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {l.ctes.map((c) => {
                            const adPendente = c.ad > 0 && !c.dataRecebAd;
                            const sdPendente = c.sd > 0 && !c.dataRecebSd;
                            const pendente = adPendente || sdPendente;
                            return (
                              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                                <td className="px-2 py-2 whitespace-nowrap">{c.data ?? "—"}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{c.cte ?? "—"}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{c.placa ?? "—"}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{c.motoristaNome ?? "—"}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(c.vlrFrete)}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(c.baseComissao)}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(c.ad)}</td>
                                <td className={`px-2 py-2 whitespace-nowrap ${adPendente ? "text-amber-700 font-medium" : ""}`}>
                                  {c.dataRecebAd ?? (c.ad > 0 ? "pendente" : "—")}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">{formatCurrency(c.sd)}</td>
                                <td className={`px-2 py-2 whitespace-nowrap ${sdPendente ? "text-amber-700 font-medium" : ""}`}>
                                  {c.dataRecebSd ?? (c.sd > 0 ? "pendente" : "—")}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                  {pendente ? (
                                    <span className="inline-flex items-center gap-1 text-amber-700">
                                      <AlertTriangle size={12} />
                                      {[adPendente && "AD", sdPendente && "SD"].filter(Boolean).join(" e ")} a cobrar
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-emerald-700">
                                      <CheckCircle2 size={12} />
                                      OK
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-right">
                                  <Link
                                    href={`/faturamento/${c.veiculoId}?ano=${c.ano}&mes=${c.mes}`}
                                    className="text-brand-600 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Abrir
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                Nenhum adiantamento ou saldo lançado neste período.
              </td>
            </tr>
          )}
        </tbody>
        {linhas.length > 0 && (
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
              <td className="px-4 py-3">Total ({linhas.length})</td>
              <td className="px-4 py-3">{formatCurrency(totais.baseComissao)}</td>
              <td className="px-4 py-3">{formatCurrency(totais.ad)}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3">{formatCurrency(totais.sd)}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-emerald-700">{formatCurrency(totais.ad + totais.sd)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
