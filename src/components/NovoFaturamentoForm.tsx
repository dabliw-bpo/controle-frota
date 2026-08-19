"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovoFaturamentoForm({
  motoristas,
  cavalos,
}: {
  motoristas: { id: string; nome: string }[];
  cavalos: { id: string; placa: string; marcaModeloVersao: string | null }[];
}) {
  const router = useRouter();
  const [motoristaId, setMotoristaId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!veiculoId) return;
    const params = new URLSearchParams();
    if (motoristaId) params.set("motoristaId", motoristaId);
    const query = params.toString();
    router.push(`/faturamento/${veiculoId}${query ? `?${query}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block font-medium text-slate-700 mb-1">Motorista</span>
          <select value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)} className="input">
            <option value="">Selecione...</option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="block font-medium text-slate-700 mb-1">Placa (Cavalo) *</span>
          <select
            required
            value={veiculoId}
            onChange={(e) => setVeiculoId(e.target.value)}
            className="input"
          >
            <option value="">Selecione...</option>
            {cavalos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} {v.marcaModeloVersao ? `— ${v.marcaModeloVersao}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={!veiculoId}
        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-5 py-2.5"
      >
        Continuar
      </button>
    </form>
  );
}
