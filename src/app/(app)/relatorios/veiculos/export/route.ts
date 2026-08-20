import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStatusList } from "@/lib/settings";
import { toCsv, csvResponse } from "@/lib/csv";
import { nomesMotoristas } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });

  const [veiculos, statusList] = await Promise.all([
    prisma.veiculo.findMany({
      include: { empresa: true, motoristasCadastrados: true },
      orderBy: { placa: "asc" },
    }),
    getStatusList(),
  ]);

  const statusMap = new Map(statusList.map((s) => [s.chave, s.label]));

  const csv = toCsv(
    ["Placa", "Status", "Tipo", "Modelo", "Renavam", "Chassi", "Empresa", "Motorista", "Valor"],
    veiculos.map((v) => [
      v.placa,
      statusMap.get(v.status) ?? v.status,
      v.carroceria,
      v.marcaModeloVersao,
      v.renavam,
      v.chassi,
      v.empresa?.nome ?? v.responsavelTexto,
      nomesMotoristas(v.motoristasCadastrados, v.motorista),
      v.valor,
    ])
  );

  return csvResponse("veiculos.csv", csv);
}
