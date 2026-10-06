import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MotoristaForm from "@/components/MotoristaForm";
import { formatCpf } from "@/lib/cpf";
import { COMISSAO_PADRAO, formatPercentual } from "@/lib/comissao";
import {
  atualizarMotorista,
  definirAtivoMotorista,
  definirComissaoMotorista,
  excluirMotorista,
  removerComissaoMotorista,
} from "../actions";

export default async function MotoristaDetalhePage({ params }: { params: { id: string } }) {
  const [motorista, veiculos] = await Promise.all([
    prisma.motorista.findUnique({
      where: { id: params.id },
      include: { veiculo: true, comissoes: { orderBy: [{ ano: "asc" }, { mes: "asc" }] } },
    }),
    prisma.veiculo.findMany({ select: { placa: true }, orderBy: { placa: "asc" } }),
  ]);

  if (!motorista) notFound();

  const atualizarAction = atualizarMotorista.bind(null, motorista.id);
  const excluirAction = excluirMotorista.bind(null, motorista.id);
  const comissaoAction = definirComissaoMotorista.bind(null, motorista.id);
  const hoje = new Date();
  const alternarAtivoAction = definirAtivoMotorista.bind(null, motorista.id, !motorista.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-500">Pessoas</p>
          <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">{motorista.nome}
            {!motorista.ativo && (
              <span className="ml-3 align-middle inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-xs font-normal text-slate-500">
                Inativo
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {motorista.cpf ? formatCpf(motorista.cpf) : "CPF não informado"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <form action={alternarAtivoAction}>
            <button className="text-sm text-slate-900 border border-slate-300 hover:border-brand-500 hover:text-brand-600 rounded-lg px-3 py-2">
              {motorista.ativo ? "Desativar motorista" : "Reativar motorista"}
            </button>
          </form>
          <form action={excluirAction}>
            <button className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Excluir motorista
            </button>
          </form>
        </div>
      </div>

      <MotoristaForm
        action={atualizarAction}
        submitLabel="Salvar alterações"
        placas={veiculos.map((v) => v.placa)}
        initial={{
          nome: motorista.nome,
          sexo: motorista.sexo,
          cadastro: motorista.cadastro,
          admissao: motorista.admissao,
          cpf: motorista.cpf ? formatCpf(motorista.cpf) : "",
          cargo: motorista.cargo,
          email: motorista.email,
          whatsapp: motorista.whatsapp,
          pix: motorista.pix,
          placa: motorista.veiculo?.placa,
        }}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900">Comissão</h3>
        <p className="text-sm text-slate-500 mt-1">
          Padrão de {formatPercentual(COMISSAO_PADRAO)}%. Cada alteração vale a partir do mês informado; os meses
          anteriores continuam com o percentual que já tinham.
        </p>

        {motorista.comissoes.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4">A partir de</th>
                <th className="py-2 pr-4">Comissão</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {motorista.comissoes.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 pr-4">{String(c.mes).padStart(2, "0")}/{c.ano}</td>
                  <td className="py-2 pr-4 font-medium">{formatPercentual(c.percentual)}%</td>
                  <td className="py-2 text-right">
                    <form action={removerComissaoMotorista.bind(null, motorista.id, c.id)}>
                      <button className="text-sm text-red-600 hover:underline">Remover</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form action={comissaoAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Comissão (%)</span>
            <input name="percentual" type="number" step="0.01" min="0" max="100" required className="input w-32" />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">A partir de (mês)</span>
            <input name="mes" type="number" min="1" max="12" required defaultValue={hoje.getMonth() + 1} className="input w-28" />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Ano</span>
            <input name="ano" type="number" min="2000" max="2100" required defaultValue={hoje.getFullYear()} className="input w-28" />
          </label>
          <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
