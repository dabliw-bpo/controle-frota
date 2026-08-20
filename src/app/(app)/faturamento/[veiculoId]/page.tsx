import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FaturamentoEditor from "@/components/FaturamentoEditor";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default async function FaturamentoVeiculoPage({
  params,
  searchParams,
}: {
  params: { veiculoId: string };
  searchParams: { ano?: string; mes?: string; motoristaId?: string };
}) {
  const veiculo = await prisma.veiculo.findUnique({
    where: { id: params.veiculoId },
    include: { motoristasCadastrados: true },
  });
  if (!veiculo) notFound();

  const hoje = new Date();
  const ano = Number(searchParams.ano) || hoje.getFullYear();
  const mes = Number(searchParams.mes) || hoje.getMonth() + 1;

  const mensal = await prisma.faturamentoMensal.findUnique({
    where: { veiculoId_ano_mes: { veiculoId: veiculo.id, ano, mes } },
    include: { lancamentos: { orderBy: { ordem: "asc" } }, motorista: true },
  });

  const motoristaEscolhido = searchParams.motoristaId
    ? await prisma.motorista.findUnique({ where: { id: searchParams.motoristaId } })
    : null;

  const motoristaEfetivo =
    motoristaEscolhido ?? mensal?.motorista ?? veiculo.motoristasCadastrados[0] ?? null;

  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/faturamento" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Faturamento
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Faturamento — {veiculo.placa}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {veiculo.carroceria} · {veiculo.marcaModeloVersao || "sem modelo"}
          {motoristaEfetivo && (
            <>
              {" · "}
              <Link href={`/motoristas/${motoristaEfetivo.id}`} className="text-brand-600 hover:underline">
                {motoristaEfetivo.nome}
              </Link>
            </>
          )}
        </p>
      </div>

      <form className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 items-end">
        <label className="text-sm">
          <span className="block font-medium text-slate-700 mb-1">Mês</span>
          <select name="mes" defaultValue={mes} className="input">
            {MESES.map((nome, i) => (
              <option key={i + 1} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700 mb-1">Ano</span>
          <select name="ano" defaultValue={ano} className="input">
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        {veiculo.motoristasCadastrados.length > 1 && (
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Motorista</span>
            <select name="motoristaId" defaultValue={motoristaEfetivo?.id ?? ""} className="input">
              {veiculo.motoristasCadastrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Ver período
        </button>
      </form>

      <FaturamentoEditor
        key={`${ano}-${mes}`}
        veiculoId={veiculo.id}
        ano={ano}
        mes={mes}
        mesNome={MESES[mes - 1]}
        placa={veiculo.placa}
        motoristaNome={motoristaEfetivo?.nome ?? null}
        motoristaId={motoristaEfetivo?.id ?? null}
        lancamentosIniciais={mensal?.lancamentos ?? []}
      />
    </div>
  );
}
