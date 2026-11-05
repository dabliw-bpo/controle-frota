import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { onlyDigits } from "@/lib/cpf";
import { fatorComissao, percentualVigente } from "@/lib/comissao";
import { placasUtilizadas } from "@/lib/format";

export const dynamic = "force-dynamic";

function chaveValida(request: NextRequest): boolean {
  const esperada = process.env.INTEGRACAO_API_KEY;
  if (!esperada) return false;
  const recebida = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Faturamento mensal de um motorista (comissão + diárias), para o portal DABLIW
// BPO. O cálculo fica aqui para que a regra de comissão (padrão + vigências por
// mês) exista num só lugar.
export async function GET(request: NextRequest) {
  if (!process.env.INTEGRACAO_API_KEY) {
    return NextResponse.json({ error: "Integração não configurada." }, { status: 503 });
  }
  if (!chaveValida(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const cpf = onlyDigits(params.get("cpf") ?? "");
  if (cpf.length !== 11) {
    return NextResponse.json({ error: "Informe um CPF válido (11 dígitos)." }, { status: 400 });
  }
  const anoParam = Number(params.get("ano"));
  const ano = Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= 2100 ? anoParam : null;

  const motorista = await prisma.motorista.findUnique({
    where: { cpf },
    include: {
      comissoes: true,
      faturamentosMensais: {
        where: ano ? { ano } : {},
        include: { veiculo: { select: { placa: true } }, lancamentos: true, diarias: true },
      },
    },
  });

  if (!motorista) {
    return NextResponse.json({ encontrado: false });
  }

  // Um motorista pode ter registros em mais de um veículo no mesmo mês.
  const porMes = new Map<
    string,
    { ano: number; mes: number; placas: Set<string>; baseComissao: number; diarias: number }
  >();
  for (const f of motorista.faturamentosMensais) {
    const chave = `${f.ano}-${String(f.mes).padStart(2, "0")}`;
    const atual = porMes.get(chave) ?? { ano: f.ano, mes: f.mes, placas: new Set<string>(), baseComissao: 0, diarias: 0 };
    atual.baseComissao += f.lancamentos.reduce(
      (acc, l) => acc + ((l.vlrFrete ?? 0) - (l.seguro ?? 0) - (l.adm ?? 0)),
      0
    );
    atual.diarias += f.diarias.reduce((acc, d) => acc + (d.valor ?? 0), 0);
    for (const placa of placasUtilizadas(f.lancamentos, f.veiculo.placa).split(", ")) atual.placas.add(placa);
    porMes.set(chave, atual);
  }

  const meses = Array.from(porMes.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([competencia, m]) => {
      const percentual = percentualVigente(motorista.comissoes, m.ano, m.mes);
      const comissao = m.baseComissao * fatorComissao(percentual);
      return {
        competencia,
        placas: Array.from(m.placas).sort(),
        baseComissao: round2(m.baseComissao),
        percentualComissao: percentual,
        comissao: round2(comissao),
        diarias: round2(m.diarias),
        total: round2(comissao + m.diarias),
      };
    });

  return NextResponse.json({
    encontrado: true,
    motorista: { nome: motorista.nome, cpf: motorista.cpf, ativo: motorista.ativo },
    meses,
  });
}

function round2(valor: number): number {
  return Math.round(valor * 100) / 100;
}
