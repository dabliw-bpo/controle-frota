import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NovoFaturamentoForm from "@/components/NovoFaturamentoForm";

export default async function NovoFaturamentoPage() {
  const [motoristas, cavalos] = await Promise.all([
    prisma.motorista.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.veiculo.findMany({
      where: { carroceria: "CAVALO" },
      select: { id: true, placa: true, marcaModeloVersao: true },
      orderBy: { placa: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/faturamento" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Faturamento
        </Link>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">Financeiro</p>
        <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">Novo faturamento</h1>
        <p className="text-slate-500 text-sm mt-1">
          Escolha o motorista e a placa (cavalo) para lançar o faturamento do período
        </p>
      </div>

      <NovoFaturamentoForm motoristas={motoristas} cavalos={cavalos} />
    </div>
  );
}
