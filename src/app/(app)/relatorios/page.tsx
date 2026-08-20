import Link from "next/link";
import { Truck, Users, Wallet, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function RelatoriosPage() {
  const [totalVeiculos, totalMotoristas, totalFaturamentos] = await Promise.all([
    prisma.veiculo.count(),
    prisma.motorista.count(),
    prisma.faturamentoMensal.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-1">
          Relatórios de cadastro e de faturamento, prontos para imprimir ou exportar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard
          href="/relatorios/veiculos"
          icon={Truck}
          title="Veículos"
          description="Relatório completo da frota cadastrada"
          count={`${totalVeiculos} veículo(s)`}
        />
        <ReportCard
          href="/relatorios/motoristas"
          icon={Users}
          title="Motoristas"
          description="Relatório completo dos motoristas cadastrados"
          count={`${totalMotoristas} motorista(s)`}
        />
        <ReportCard
          href="/relatorios/faturamento"
          icon={Wallet}
          title="Faturamento"
          description="Relatório de faturamento por período, com totais e lucratividade"
          count={`${totalFaturamentos} lançamento(s) mensais`}
        />
      </div>
    </div>
  );
}

function ReportCard({
  href,
  icon: Icon,
  title,
  description,
  count,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  count: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-400 hover:shadow-card transition-all block"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
        <Icon size={20} strokeWidth={2} />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
      <p className="text-xs text-slate-400 mt-3">{count}</p>
    </Link>
  );
}
