import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NovoFaturamentoForm from "@/components/NovoFaturamentoForm";

export default async function NovoFaturamentoPage() {
  const [motoristas, cavalos] = await Promise.all([
    prisma.motorista.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
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
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Novo faturamento</h1>
        <p className="text-slate-500 text-sm mt-1">
          Escolha o motorista e a placa (cavalo) para lançar o faturamento do período
        </p>
      </div>

      <NovoFaturamentoForm motoristas={motoristas} cavalos={cavalos} />
    </div>
  );
}
