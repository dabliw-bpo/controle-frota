import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MultaForm from "@/components/MultaForm";
import { atualizarMulta, excluirMulta } from "../actions";

export default async function MultaDetalhePage({ params }: { params: { id: string } }) {
  const [multa, veiculos, motoristas] = await Promise.all([
    prisma.multa.findUnique({ where: { id: params.id }, include: { veiculo: true, motorista: true } }),
    prisma.veiculo.findMany({ select: { id: true, placa: true }, orderBy: { placa: "asc" } }),
    prisma.motorista.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!multa) notFound();

  const atualizarAction = atualizarMulta.bind(null, multa.id);
  const excluirAction = excluirMulta.bind(null, multa.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/multas" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Multas
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multa — {multa.veiculo.placa}</h1>
          <p className="text-slate-500 text-sm mt-1">{multa.motorista?.nome ?? "Sem motorista vinculado"}</p>
        </div>
        <form action={excluirAction}>
          <button className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-nowrap">
            Excluir multa
          </button>
        </form>
      </div>

      <MultaForm
        action={atualizarAction}
        submitLabel="Salvar alterações"
        veiculos={veiculos}
        motoristas={motoristas}
        initial={{
          veiculoId: multa.veiculoId,
          motoristaId: multa.motoristaId,
          data: multa.data,
          descricao: multa.descricao,
          valor: multa.valor,
          descontarMotorista: multa.descontarMotorista,
        }}
      />
    </div>
  );
}
