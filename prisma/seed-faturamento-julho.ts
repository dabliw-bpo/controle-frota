import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

const XLSX_PATH = path.join(process.cwd(), "FATURAMENTO JULHO.xlsx");
const ANO = 2026;
const MES = 7;

// aba da planilha -> nome exato do motorista já cadastrado no site
// (CLAUDIO SANTIN e JUNIOR MELONI ficaram de fora: a placa informada na aba deles
// conflita com a placa de outro motorista no mesmo mês — ver aviso final)
const SHEET_TO_MOTORISTA: Record<string, string> = {
  CLAUDE: "CLAUDE GOMES FERNANDES",
  CLEITON: "CLEITON RODRIGUES DA CONCEICAO",
  DAMIÃO: "DAMIAO ALEXANDRE DA SILVA",
  DENIS: "DENIS DE ALMEIDA SILVA",
  "EDER MENDES": "EDER MENDES DA SILVA RIOS",
  EDILEUZA: "EDILEUZA FELIPE DO NASCIMENTO",
  "EDUARDO FARIAS": "EDUARDO FARIAS DA SILVA",
  ELIELSON: "ELIELSON SANTOS DE SENA",
  GEORGETO: "GEORGETO DA SILVA",
  "GILBERTO FERREIRA": "GILBERTO FERREIRA DA SILVA",
  GLEYCE: "GLEYCE KELI DA SILVA ROSA",
  IKARO: "IKARO GABRIEL LEANDRO DE SÁ",
  JANIEL: "JANIEL ABREU DA SILVA",
  "JOSE SALES": "JOSE WILSON SALES DA SILVA",
  "JUCIRAH GUSMÃO": "JUCIRAH DE JESUS GUSMAO",
  "LUIZ MAGNO": "LUIZ MAGNO MARQUES DA SILVA",
  "LUIS EDINALDO": "LUIS EDINALDO VASCONCELOS BEZERRA",
  MARLY: "MARLY DE SOUZA",
  "MARCOS ARRUPIADO": "MARCOS APARECIDO CRUZ",
  "RAFAEL NASCIMENTO": "RAFAEL DO NASCIMENTO ROSA",
  SAMUEL: "SAMUEL DE ALMEIDA LEÃO",
  "WESLEY BARBOSA": "WESLEY BARBOSA",
};

const SKIPPED_NAO_CADASTRADO = ["AIRTON", "DANILLA", "DARLISSON", "DIEGO JOVEM"];
const SKIPPED_CONFLITO = ["CLAUDIO SANTIN", "JUNIOR MELONI"];

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseMoney(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function normalizePlaca(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().toUpperCase().replace(/\s+/g, "");
  return s || null;
}

async function main() {
  console.log("Lendo planilha:", XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true });

  let totalLancamentos = 0;
  let totalMeses = 0;

  for (const [sheetName, motoristaNome] of Object.entries(SHEET_TO_MOTORISTA)) {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.log(`  aviso: aba "${sheetName}" não encontrada`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }) as any[][];

    let placa: string | null = null;
    let headerIdx = -1;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const a = String(rows[i][0] || "").trim().toUpperCase();
      if (a.startsWith("PLACA")) placa = normalizePlaca(rows[i][2]);
      if (a === "DATA") headerIdx = i;
    }
    if (!placa || headerIdx === -1) {
      console.log(`  aviso: aba "${sheetName}" sem placa ou cabeçalho de lançamentos`);
      continue;
    }

    const veiculo = await prisma.veiculo.findUnique({ where: { placa } });
    if (!veiculo) {
      console.log(`  aviso: placa ${placa} (aba "${sheetName}") não encontrada na frota`);
      continue;
    }

    const motorista = await prisma.motorista.findFirst({ where: { nome: motoristaNome } });
    if (!motorista) {
      console.log(`  aviso: motorista "${motoristaNome}" não encontrado no cadastro`);
      continue;
    }

    const lancamentos: {
      ordem: number;
      data: string | null;
      descricao: string | null;
      cte: string | null;
      vlrFrete: number | null;
      despesas: number | null;
      abastecimento: number | null;
      pedagio: number | null;
      seguro: number | null;
      adm: number | null;
    }[] = [];

    // varre uma janela generosa após o cabeçalho (bem maior que qualquer nº real de
    // viagens observado) e considera viagem só a linha com DATA preenchida — assim
    // pula sem parar linhas de "DIÁRIA" (data vazia, no meio da lista), linhas de
    // preenchimento em branco e a linha de totais (com ou sem o rótulo "Total").
    const limite = Math.min(rows.length, headerIdx + 80);
    for (let i = headerIdx + 1; i < limite; i++) {
      const row = rows[i];
      const data = str(row[0]);
      if (!data || data.toUpperCase() === "TOTAL") continue;

      lancamentos.push({
        ordem: lancamentos.length,
        data: str(row[0]),
        descricao: str(row[1]),
        cte: str(row[2]),
        vlrFrete: parseMoney(row[3]),
        despesas: parseMoney(row[4]),
        abastecimento: parseMoney(row[5]),
        pedagio: parseMoney(row[6]),
        seguro: parseMoney(row[7]),
        adm: parseMoney(row[8]),
      });
    }

    const mensal = await prisma.faturamentoMensal.upsert({
      where: { veiculoId_ano_mes: { veiculoId: veiculo.id, ano: ANO, mes: MES } },
      create: { veiculoId: veiculo.id, ano: ANO, mes: MES, motoristaId: motorista.id },
      update: { motoristaId: motorista.id },
    });

    await prisma.faturamentoLancamento.deleteMany({ where: { faturamentoMensalId: mensal.id } });
    if (lancamentos.length) {
      await prisma.faturamentoLancamento.createMany({
        data: lancamentos.map((l) => ({ ...l, faturamentoMensalId: mensal.id })),
      });
    }

    console.log(`  ${motoristaNome} (${placa}): ${lancamentos.length} lançamento(s)`);
    totalLancamentos += lancamentos.length;
    totalMeses++;
  }

  console.log(`\nImportação concluída: ${totalMeses} motorista(s), ${totalLancamentos} lançamento(s) — Julho/${ANO}`);
  console.log(`Ignorados (motorista não cadastrado no site): ${SKIPPED_NAO_CADASTRADO.join(", ")}`);
  console.log(`Ignorados (conflito de placa com outro motorista no mesmo mês): ${SKIPPED_CONFLITO.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
