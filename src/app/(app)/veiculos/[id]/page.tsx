import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import VeiculoForm from "@/components/VeiculoForm";
import { formatCurrency } from "@/lib/format";
import {
  atualizarVeiculo,
  excluirVeiculo,
  salvarFinanciamento,
  salvarSeguro,
  adicionarCartao,
  removerCartao,
  salvarImposto,
  excluirImposto,
} from "../actions";

export default async function VeiculoDetalhePage({ params }: { params: { id: string } }) {
  const veiculo = await prisma.veiculo.findUnique({
    where: { id: params.id },
    include: {
      empresa: true,
      financiamento: true,
      seguro: true,
      cartoes: true,
      impostos: { orderBy: { ano: "desc" } },
      venda: true,
      locacao: true,
      motoristasCadastrados: true,
    },
  });

  if (!veiculo) notFound();

  const atualizarAction = atualizarVeiculo.bind(null, veiculo.id);
  const excluirAction = excluirVeiculo.bind(null, veiculo.id);
  const financiamentoAction = salvarFinanciamento.bind(null, veiculo.id);
  const seguroAction = salvarSeguro.bind(null, veiculo.id);
  const cartaoAction = adicionarCartao.bind(null, veiculo.id);
  const impostoAction = salvarImposto.bind(null, veiculo.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{veiculo.placa}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {veiculo.carroceria} · {veiculo.marcaModeloVersao || "sem modelo informado"}
          </p>
        </div>
        <form action={excluirAction}>
          <button className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Excluir veículo
          </button>
        </form>
      </div>

      <VeiculoForm
        action={atualizarAction}
        submitLabel="Salvar alterações"
        initial={{
          placa: veiculo.placa,
          status: veiculo.status,
          empresaNome: veiculo.empresa?.nome ?? veiculo.responsavelTexto,
          docCnpj: veiculo.docCnpj,
          numeroPatrimonio: veiculo.numeroPatrimonio,
          carroceria: veiculo.carroceria,
          fabricacaoAno: veiculo.fabricacaoAno,
          marcaModeloVersao: veiculo.marcaModeloVersao,
          renavam: veiculo.renavam,
          chassi: veiculo.chassi,
          cor: veiculo.cor,
          valor: veiculo.valor,
          motorista: veiculo.motorista,
          rastreador: veiculo.rastreador,
          antt: veiculo.antt,
          notaFiscal: veiculo.notaFiscal,
          rotaAtual: veiculo.rotaAtual,
          produtoAtual: veiculo.produtoAtual,
          ocorrencias: veiculo.ocorrencias,
          observacoes: veiculo.observacoes,
        }}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">
          Motoristas cadastrados
          {veiculo.motoristasCadastrados.length > 1 && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({veiculo.motoristasCadastrados.length})
            </span>
          )}
        </h3>
        {veiculo.motoristasCadastrados.length > 0 ? (
          <div className="space-y-3">
            {veiculo.motoristasCadastrados.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <Link href={`/motoristas/${m.id}`} className="font-medium text-brand-600 hover:underline">
                    {m.nome}
                  </Link>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {m.cargo || "—"}
                    {m.whatsapp ? ` · ${m.whatsapp}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/faturamento/${veiculo.id}?motoristaId=${m.id}`}
                    className="text-sm text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-3 py-2"
                  >
                    Lançar faturamento
                  </Link>
                  <Link
                    href={`/motoristas/${m.id}`}
                    className="text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    Editar vínculo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Nenhum motorista vinculado ·{" "}
            <Link href="/motoristas/novo" className="text-brand-600 hover:underline">
              cadastrar motorista
            </Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Financiamento</h3>
          <form action={financiamentoAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Situação" name="situacao" defaultValue={veiculo.financiamento?.situacao} />
              <LabeledInput label="Banco / Alienação" name="banco" defaultValue={veiculo.financiamento?.banco} />
              <LabeledInput label="Contrato" name="contrato" defaultValue={veiculo.financiamento?.contrato} />
              <LabeledInput
                label="Data operação"
                name="dataOperacao"
                defaultValue={veiculo.financiamento?.dataOperacao}
              />
              <LabeledInput
                label="Parcelas totais"
                name="parcelasTotais"
                type="number"
                defaultValue={veiculo.financiamento?.parcelasTotais?.toString()}
              />
              <LabeledInput
                label="Parcelas restantes"
                name="parcelasRemanescentes"
                type="number"
                defaultValue={veiculo.financiamento?.parcelasRemanescentes?.toString()}
              />
              <LabeledInput
                label="Saldo p/ quitação"
                name="saldoQuitacao"
                type="number"
                step="0.01"
                defaultValue={veiculo.financiamento?.saldoQuitacao?.toString()}
              />
              <LabeledInput
                label="Valor"
                name="valor"
                type="number"
                step="0.01"
                defaultValue={veiculo.financiamento?.valor?.toString()}
              />
            </div>
            <SaveButton />
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Seguro</h3>
          <form action={seguroAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Seguradora" name="seguradora" defaultValue={veiculo.seguro?.seguradora} />
              <LabeledInput label="Apólice" name="apolice" defaultValue={veiculo.seguro?.apolice} />
              <LabeledInput
                label="Valor"
                name="valor"
                type="number"
                step="0.01"
                defaultValue={veiculo.seguro?.valor?.toString()}
              />
            </div>
            <SaveButton />
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Cartões de despesa</h3>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="pb-2 font-medium">Nome impresso</th>
              <th className="pb-2 font-medium">Número</th>
              <th className="pb-2 font-medium">Frota</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {veiculo.cartoes.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0">
                <td className="py-2">{c.nomeImpresso}</td>
                <td className="py-2 text-slate-600">{c.numeroCartao || "—"}</td>
                <td className="py-2 text-slate-600">{c.frotaNumero || "—"}</td>
                <td className="py-2 text-right">
                  <form action={removerCartao.bind(null, c.id, veiculo.id)}>
                    <button className="text-red-600 text-xs hover:underline">remover</button>
                  </form>
                </td>
              </tr>
            ))}
            {veiculo.cartoes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center text-slate-400">
                  Nenhum cartão vinculado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <form action={cartaoAction} className="flex gap-2 flex-wrap">
          <input name="nomeImpresso" placeholder="Nome impresso" className="input max-w-[180px]" />
          <input name="numeroCartao" placeholder="Número do cartão" className="input max-w-[180px]" />
          <input name="frotaNumero" placeholder="Frota nº" className="input max-w-[100px]" />
          <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2">
            Adicionar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">IPVA / Licenciamento</h3>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="pb-2 font-medium">Ano</th>
              <th className="pb-2 font-medium">Venc. licenciamento</th>
              <th className="pb-2 font-medium">Valor licenc.</th>
              <th className="pb-2 font-medium">Venc. IPVA</th>
              <th className="pb-2 font-medium">Multas</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {veiculo.impostos.map((i) => (
              <tr key={i.id} className="border-b border-slate-50 last:border-0">
                <td className="py-2 font-medium">{i.ano}</td>
                <td className="py-2 text-slate-600">{i.licenciamentoVencimento || "—"}</td>
                <td className="py-2 text-slate-600">{formatCurrency(i.licenciamentoValor)}</td>
                <td className="py-2 text-slate-600">{i.ipvaVencimento || "—"}</td>
                <td className="py-2 text-slate-600">{formatCurrency(i.multasValor)}</td>
                <td className="py-2 text-right">
                  <form action={excluirImposto.bind(null, i.id, veiculo.id)}>
                    <button className="text-red-600 text-xs hover:underline">remover</button>
                  </form>
                </td>
              </tr>
            ))}
            {veiculo.impostos.length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-center text-slate-400">
                  Nenhum lançamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <form action={impostoAction} className="flex gap-2 flex-wrap items-end">
          <LabeledInput label="Ano" name="ano" type="number" defaultValue={new Date().getFullYear().toString()} />
          <LabeledInput label="Venc. licenciamento" name="licenciamentoVencimento" />
          <LabeledInput label="Valor licenciamento" name="licenciamentoValor" type="number" step="0.01" />
          <LabeledInput label="Venc. IPVA" name="ipvaVencimento" />
          <LabeledInput label="Multas" name="multasValor" type="number" step="0.01" />
          <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 h-[38px]">
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  name,
  type = "text",
  step,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-sm">
      <span className="block font-medium text-slate-700 mb-1">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        className="input"
      />
    </label>
  );
}

function SaveButton() {
  return (
    <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2">
      Salvar
    </button>
  );
}
