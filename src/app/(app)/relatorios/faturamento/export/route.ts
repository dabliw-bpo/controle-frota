import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { placasUtilizadas } from "@/lib/format";
import { NextRequest } from "next/server";

const COMISSAO_PERCENTUAL = 0.12;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });

  const hoje = new Date();
  const { searchParams } = new URL(request.url);
  const mes = Number(searchParams.get("mes")) || hoje.getMonth() + 1;
  const ano = Number(searchParams.get("ano")) || hoje.getFullYear();

  const faturamentos = await prisma.faturamentoMensal.findMany({
    where: { ano, mes },
    include: { veiculo: true, motorista: true, lancamentos: true },
  });

  const linhas = faturamentos.map((f) => {
    const frete = f.lancamentos.reduce((acc, l) => acc + (l.vlrFrete ?? 0), 0);
    const abastecimento = f.lancamentos.reduce((acc, l) => acc + (l.abastecimento ?? 0), 0);
    const despesas = f.lancamentos.reduce((acc, l) => acc + (l.despesas ?? 0), 0);
    const pedagio = f.lancamentos.reduce((acc, l) => acc + (l.pedagio ?? 0), 0);
    const comissao = f.lancamentos.reduce(
      (acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)) * COMISSAO_PERCENTUAL,
      0
    );
    const lucro = frete - abastecimento - despesas - pedagio - comissao;
    return [
      placasUtilizadas(f.lancamentos, f.veiculo.placa),
      f.motorista?.nome,
      frete,
      despesas,
      abastecimento,
      pedagio,
      comissao,
      lucro,
    ];
  });

  const csv = toCsv(
    ["Placa", "Motorista", "Vlr. Frete", "Despesas", "Abastecimento", "Pedágio", "Comissão", "Lucro"],
    linhas
  );

  return csvResponse(`faturamento-${mes}-${ano}.csv`, csv);
}
