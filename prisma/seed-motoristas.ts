import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

const XLSX_PATH = path.join(process.cwd(), "MOTORISTAS.xlsx");

const PLACA_REGEX = /^[A-Z]{3}\d([A-Z]\d{2}|\d{3})$/;

function normalizePlaca(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return null;
  return PLACA_REGEX.test(s) ? s : null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function onlyDigits(v: unknown): string | null {
  const s = String(v ?? "").replace(/\D/g, "");
  return s === "" ? null : s;
}

function colIndex(headers: string[], name: string): number {
  const target = name.trim().toUpperCase();
  return headers.findIndex((h) => (h || "").trim().toUpperCase() === target);
}

function get(row: any[], headers: string[], name: string): unknown {
  const idx = colIndex(headers, name);
  return idx === -1 ? null : row[idx];
}

async function main() {
  console.log("Lendo planilha:", XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }) as any[][];

  const headers = rows[0].map((c) => String(c ?? ""));
  let count = 0;
  let vinculados = 0;

  for (const row of rows.slice(1)) {
    const nome = str(get(row, headers, "COLABORADOR"));
    if (!nome || /^\d+$/.test(nome)) continue; // ignora linha de total/rodapé

    const cpf = onlyDigits(get(row, headers, "C.P.F"));
    const placa = normalizePlaca(get(row, headers, "CAVALO"));

    const veiculo = placa ? await prisma.veiculo.findUnique({ where: { placa } }) : null;
    if (placa && !veiculo) {
      console.log(`  aviso: placa ${placa} (motorista ${nome}) não encontrada na frota`);
    }

    const data = {
      nome,
      sexo: str(get(row, headers, "SEXO")),
      cadastro: str(get(row, headers, "CADASTRO")),
      admissao: str(get(row, headers, "ADMISSÃO")),
      cpf,
      cargo: str(get(row, headers, "CARGO")),
      email: str(get(row, headers, "e-mail")),
      whatsapp: str(get(row, headers, "WhatsApp")),
      pix: str(get(row, headers, "PIX")),
      veiculoId: veiculo?.id ?? null,
    };

    const existing = cpf
      ? await prisma.motorista.findUnique({ where: { cpf } })
      : await prisma.motorista.findFirst({ where: { nome } });

    if (existing) {
      await prisma.motorista.update({ where: { id: existing.id }, data });
    } else {
      await prisma.motorista.create({ data });
    }

    count++;
    if (veiculo) vinculados++;
  }

  console.log(`\nMotoristas importados: ${count} (${vinculados} vinculados a um veículo)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
