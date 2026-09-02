import { prisma } from "@/lib/prisma";
import { STATUS_VEICULO_OUTRO_MENU } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getStatusList } from "@/lib/settings";
import PieChart, { PIE_PALETTE, corNomeParaHex } from "@/components/PieChart";

const FROTA_ATIVA_WHERE = { status: { notIn: [...STATUS_VEICULO_OUTRO_MENU] as string[] } };

export default async function DashboardPage() {
  const statusList = await getStatusList();
  const [total, porStatus, porTipo, porEmpresa, motoristasCount, veiculosLeves, veiculos] = await Promise.all([
    prisma.veiculo.count({ where: FROTA_ATIVA_WHERE }),
    prisma.veiculo.groupBy({ by: ["status"], where: FROTA_ATIVA_WHERE, _count: { status: true } }),
    prisma.veiculo.groupBy({ by: ["carroceria"], where: FROTA_ATIVA_WHERE, _count: { carroceria: true } }),
    prisma.veiculo.groupBy({ by: ["empresaId"], where: FROTA_ATIVA_WHERE, _count: { empresaId: true } }),
    prisma.motorista.count(),
    prisma.veiculo.count({ where: { ...FROTA_ATIVA_WHERE, carroceria: "CARRO" } }),
    prisma.veiculo.findMany({ where: FROTA_ATIVA_WHERE, select: { valor: true } }),
  ]);

  const statusMap = new Map(porStatus.map((s) => [s.status, s._count.status]));
  const valorTotalFrota = veiculos.reduce((acc, v) => acc + (v.valor ?? 0), 0);

  const tipos = porTipo
    .filter((t) => t.carroceria)
    .sort((a, b) => b._count.carroceria - a._count.carroceria);

  const empresas = await prisma.empresa.findMany();
  const empresaMap = new Map(empresas.map((e) => [e.id, e.nome]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Visão geral da frota ativa (não inclui alugados/vendidos)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Valor total (frota)" value={formatCurrency(valorTotalFrota)} colSpan={2} />
        <StatCard label="Total de veículos" value={total.toString()} />
        <StatCard label="Ativos" value={(statusMap.get("ATIVO") ?? 0).toString()} />
        <StatCard label="Em manutenção" value={(statusMap.get("MANUTENCAO") ?? 0).toString()} />
        <StatCard label="Motoristas" value={motoristasCount.toString()} />
        <StatCard label="Veículos leves (carros)" value={veiculosLeves.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por status</h2>
          <PieChart
            data={statusList
              .map((status) => ({
                label: status.label,
                value: statusMap.get(status.chave) ?? 0,
                color: corNomeParaHex(status.cor),
              }))
              .filter((d) => d.value > 0)}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por tipo</h2>
          <PieChart
            data={tipos.map((t, i) => ({
              label: t.carroceria ?? "—",
              value: t._count.carroceria,
              color: PIE_PALETTE[i % PIE_PALETTE.length],
            }))}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Veículos por empresa</h2>
          <PieChart
            data={porEmpresa
              .filter((e) => e.empresaId)
              .map((e, i) => ({
                label: empresaMap.get(e.empresaId!) ?? "—",
                value: e._count.empresaId,
                color: PIE_PALETTE[i % PIE_PALETTE.length],
              }))}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: string;
  colSpan?: 2;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 xl:p-5 min-w-0 ${
        colSpan === 2 ? "col-span-2" : ""
      }`}
    >
      <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
      <p className="text-lg xl:text-xl font-bold text-slate-900 mt-1 whitespace-nowrap overflow-x-auto">
        {value}
      </p>
    </div>
  );
}
