"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || user.role === "VISUALIZADOR") {
    throw new Error("Sem permissão para esta ação.");
  }
  return user;
}

export type LancamentoInput = {
  data: string | null;
  placa: string | null;
  descricao: string | null;
  cte: string | null;
  vlrFrete: number | null;
  despesas: number | null;
  abastecimento: number | null;
  pedagio: number | null;
  seguro: number | null;
  adm: number | null;
};

export async function salvarFaturamento(input: {
  veiculoId: string;
  ano: number;
  mes: number;
  motoristaId: string | null;
  lancamentos: LancamentoInput[];
}) {
  await requireEditor();

  const mensal = await prisma.faturamentoMensal.upsert({
    where: {
      veiculoId_ano_mes: { veiculoId: input.veiculoId, ano: input.ano, mes: input.mes },
    },
    create: {
      veiculoId: input.veiculoId,
      ano: input.ano,
      mes: input.mes,
      motoristaId: input.motoristaId,
    },
    update: {
      motoristaId: input.motoristaId,
    },
  });

  const linhasValidas = input.lancamentos.filter(
    (l) =>
      (l.data && l.data.trim()) ||
      (l.descricao && l.descricao.trim()) ||
      (l.cte && l.cte.trim()) ||
      l.vlrFrete ||
      l.despesas ||
      l.abastecimento ||
      l.pedagio ||
      l.seguro ||
      l.adm
  );

  await prisma.$transaction([
    prisma.faturamentoLancamento.deleteMany({ where: { faturamentoMensalId: mensal.id } }),
    ...(linhasValidas.length
      ? [
          prisma.faturamentoLancamento.createMany({
            data: linhasValidas.map((l, idx) => ({
              faturamentoMensalId: mensal.id,
              ordem: idx,
              data: l.data,
              placa: l.placa,
              descricao: l.descricao,
              cte: l.cte,
              vlrFrete: l.vlrFrete,
              despesas: l.despesas,
              abastecimento: l.abastecimento,
              pedagio: l.pedagio,
              seguro: l.seguro,
              adm: l.adm,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/faturamento/${input.veiculoId}`);
  return { ok: true };
}
