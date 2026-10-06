import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import FaturamentoEditor from "@/components/FaturamentoEditor";
import { percentualVigente } from "@/lib/comissao";

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
  const [veiculo, clientes, veiculosCavalo] = await Promise.all([
    prisma.veiculo.findUnique({
      where: { id: params.veiculoId },
      include: { motoristasCadastrados: { where: { ativo: true }, include: { comissoes: true } } },
    }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.veiculo.findMany({
      where: { carroceria: "CAVALO" },
      select: { placa: true },
      orderBy: { placa: "asc" },
    }),
  ]);
  if (!veiculo) notFound();

  const placasCavalo = Array.from(new Set([...veiculosCavalo.map((v) => v.placa), veiculo.placa])).sort();

  const hoje = new Date();
  const ano = Number(searchParams.ano) || hoje.getFullYear();
  const mes = Number(searchParams.mes) || hoje.getMonth() + 1;

  // O motorista precisa ser resolvido antes de buscar o faturamento do mês,
  // já que cada motorista tem seu próprio registro mesmo quando a placa é
  // compartilhada por mais de um (senão o faturamento de um vaza para o outro).
  const motoristaEscolhido = searchParams.motoristaId
    ? await prisma.motorista.findUnique({ where: { id: searchParams.motoristaId }, include: { comissoes: true } })
    : null;

  const motoristaEfetivo = motoristaEscolhido ?? veiculo.motoristasCadastrados[0] ?? null;

  const mensal = await prisma.faturamentoMensal.findFirst({
    where: { veiculoId: veiculo.id, ano, mes, motoristaId: motoristaEfetivo?.id ?? null },
    include: {
      lancamentos: { orderBy: { ordem: "asc" } },
      diarias: { orderBy: { ordem: "asc" } },
      motorista: true,
    },
  });

  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/faturamento" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Faturamento
        </Link>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">Financeiro</p>
        <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">
          Faturamento — {motoristaEfetivo?.nome ?? veiculo.placa}
        </h1>
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
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2.5">
          Ver período
        </button>
      </form>

      <FaturamentoEditor
        key={`${ano}-${mes}-${motoristaEfetivo?.id ?? "sem-motorista"}`}
        veiculoId={veiculo.id}
        ano={ano}
        mes={mes}
        mesNome={MESES[mes - 1]}
        placa={veiculo.placa}
        motoristaNome={motoristaEfetivo?.nome ?? null}
        motoristaId={motoristaEfetivo?.id ?? null}
        comissaoPercentual={percentualVigente(motoristaEfetivo?.comissoes, ano, mes)}
        lancamentosIniciais={mensal?.lancamentos ?? []}
        diariasIniciais={mensal?.diarias ?? []}
        clientes={clientes}
        placasCavalo={placasCavalo}
      />
    </div>
  );
}
