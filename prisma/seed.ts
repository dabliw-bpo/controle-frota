import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

const XLSX_PATH = path.join(process.cwd(), "0_RELAÇÃO DE FROTA+2025.xlsx");

// ---------- helpers ----------

// Formato antigo (ABC1234) ou Mercosul (ABC1D23)
const PLACA_REGEX = /^[A-Z]{3}\d([A-Z]\d{2}|\d{3})$/;

function normalizePlaca(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim().toUpperCase();
  if (!s) return null;
  // strip trailing "-2025" style suffixes used for duplicate rows in some sheets
  s = s.replace(/-\d{4}$/, "");
  s = s.replace(/\s+/g, "");
  if (!PLACA_REGEX.test(s)) return null; // descarta linhas de total/rodapé e lixo
  return s || null;
}

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

function parseInt_(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeStatus(v: unknown): string {
  const s = (str(v) || "").toUpperCase();
  if (!s) return "ATIVO";
  if (s.includes("ROTA")) return "ATIVO"; // "Em rota" é tratado como Ativo
  if (s.includes("MANUTEN")) return "MANUTENCAO";
  if (s.includes("PARADO")) return "PARADO";
  if (s.includes("ALUGADO")) return "ALUGADO";
  if (s.includes("VENDIDO")) return "VENDIDO";
  if (s.includes("APREEND")) return "APREENDIDO";
  if (s.includes("DEVOLV")) return "DEVOLVIDO";
  return "ATIVO";
}

function colIndex(headers: string[], name: string): number {
  const target = name.trim().toUpperCase();
  return headers.findIndex((h) => (h || "").trim().toUpperCase() === target);
}

function get(row: any[], headers: string[], name: string): unknown {
  const idx = colIndex(headers, name);
  return idx === -1 ? null : row[idx];
}

function findHeaderRow(rows: any[][], marker: string): { headerIdx: number; headers: string[] } {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map((c) => (c === undefined ? "" : String(c).trim().toUpperCase()));
    if (row.includes(marker.toUpperCase())) {
      return { headerIdx: i, headers: rows[i].map((c) => (c === undefined ? "" : String(c))) };
    }
  }
  throw new Error(`Header row with marker "${marker}" not found`);
}

function sheetRows(wb: XLSX.WorkBook, sheetName: string): any[][] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }) as any[][];
}

function monthlyColumns(headers: string[]): number[] {
  const re = /^[a-z]{3}\/\d{2}$/i;
  const idxs: number[] = [];
  headers.forEach((h, i) => {
    if (re.test((h || "").trim())) idxs.push(i);
  });
  return idxs;
}

function extractPagamentos(row: any[], headers: string[]): string | null {
  const idxs = monthlyColumns(headers);
  const obj: Record<string, number> = {};
  let any = false;
  for (const i of idxs) {
    const v = parseMoney(row[i]);
    if (v !== null) {
      obj[headers[i].trim()] = v;
      any = true;
    }
  }
  return any ? JSON.stringify(obj) : null;
}

// ---------- empresa ----------

const empresaCache = new Map<string, string>(); // key: nome|cnpj -> id

async function resolveEmpresa(nome: string | null, cnpj: string | null): Promise<string | null> {
  if (!nome) return null;
  const cacheKey = `${nome}|${cnpj ?? ""}`;
  if (empresaCache.has(cacheKey)) return empresaCache.get(cacheKey)!;

  let empresa = cnpj ? await prisma.empresa.findUnique({ where: { cnpj } }) : null;
  if (!empresa) empresa = await prisma.empresa.findFirst({ where: { nome } });
  if (!empresa) {
    empresa = await prisma.empresa.create({ data: { nome, cnpj: cnpj || undefined } });
  }
  empresaCache.set(cacheKey, empresa.id);
  return empresa.id;
}

// ---------- veiculo upsert (merge, don't clobber with blanks) ----------

async function upsertVeiculo(placaRaw: unknown, data: Record<string, any>): Promise<string | null> {
  const placa = normalizePlaca(placaRaw);
  if (!placa) return null;

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "")
  );

  const existing = await prisma.veiculo.findUnique({ where: { placa } });
  if (existing) {
    await prisma.veiculo.update({ where: { id: existing.id }, data: clean });
    return existing.id;
  }
  const created = await prisma.veiculo.create({ data: { placa, ...clean } });
  return created.id;
}

// ---------- main ----------

async function main() {
  console.log("Lendo planilha:", XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: true });

  // 1. Usuário admin
  const cpfAdmin = "00000000000";
  const senhaAdmin = "TrocarSenha123!";
  const senhaHash = await bcrypt.hash(senhaAdmin, 10);
  await prisma.usuario.upsert({
    where: { cpf: cpfAdmin },
    update: {},
    create: {
      nome: "Administrador",
      cpf: cpfAdmin,
      senhaHash,
      role: "ADMIN",
    },
  });
  console.log("Usuário admin: CPF 000.000.000-00 / senha:", senhaAdmin);

  // 2. MOVIM. ENTRADA DE BENS_FROTA (frota ativa - fonte principal)
  {
    const rows = sheetRows(wb, "MOVIM. ENTRADA DE BENS_FROTA");
    const { headerIdx, headers } = findHeaderRow(rows, "MOTORISTA");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const placa = normalizePlaca(get(row, headers, "PLACA"));
      if (!placa) continue;

      const empresaNome = str(get(row, headers, "RESPONSÁVEL"));
      const docCnpj = str(get(row, headers, "DOC CNPJ"));
      const empresaId = await resolveEmpresa(empresaNome, docCnpj);

      const veiculoId = await upsertVeiculo(placa, {
        empresaId,
        responsavelTexto: empresaNome,
        docCnpj,
        // motorista: gerenciado pelo cadastro de Motoristas (prisma/seed-motoristas.ts), não pela planilha de frota
        numeroPatrimonio: str(get(row, headers, "Nº PATRIMONIO")),
        gov: str(get(row, headers, "GOV")),
        fabricacaoAno: str(get(row, headers, "FABRIC/MODELO")),
        carroceria: str(get(row, headers, "CARROCERIA")),
        marcaModeloVersao: str(get(row, headers, "MARCA / MODELO / VERSÃO")),
        renavam: str(get(row, headers, "RENAVAN")),
        chassi: str(get(row, headers, "CHASSI")),
        valor: parseMoney(get(row, headers, "R$")),
        cor: str(get(row, headers, "COR")),
        antt: str(get(row, headers, "ANTT")),
        notaFiscal: str(get(row, headers, "NOTA FISCAL")),
        rastreador: str(get(row, headers, "RASTREADOR")),
        ocorrencias: str(get(row, headers, "OCORRÊNCIAS")),
        status: normalizeStatus(get(row, headers, "STATUS")),
        rotaAtual: str(get(row, headers, "ROTA")),
        produtoAtual: str(get(row, headers, "PRODUTO")),
      });
      if (!veiculoId) continue;

      const seguradora = str(get(row, headers, "SEGURADORA/APOLICE"));
      const valorSeguro = parseMoney(get(row, headers, "VALOR (R$)"));
      if (seguradora || valorSeguro) {
        await prisma.seguro.upsert({
          where: { veiculoId },
          create: { veiculoId, seguradora, valor: valorSeguro },
          update: { seguradora: seguradora ?? undefined, valor: valorSeguro ?? undefined },
        });
      }
      count++;
    }
    console.log(`MOVIM. ENTRADA DE BENS_FROTA: ${count} veículos importados`);
  }

  // 3. GOV (financiamentos)
  {
    const rows = sheetRows(wb, "GOV");
    const { headerIdx, headers } = findHeaderRow(rows, "SITUAÇÃO");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const placa = normalizePlaca(get(row, headers, "PLACA"));
      if (!placa) continue;

      const empresaNome = str(get(row, headers, "EMPRESA"));
      const cnpj = str(get(row, headers, "CNPJ"));
      const empresaId = await resolveEmpresa(empresaNome, cnpj);

      const situacao = str(get(row, headers, "SITUAÇÃO"));

      const veiculoId = await upsertVeiculo(placa, {
        empresaId,
        responsavelTexto: empresaNome,
        docCnpj: cnpj,
        carroceria: str(get(row, headers, "TIPO")),
        marcaModeloVersao: str(get(row, headers, "MODELO")),
        renavam: str(get(row, headers, "RENAVAN")),
        chassi: str(get(row, headers, "CHASSI")),
        fabricacaoAno: str(get(row, headers, "ANO")),
        valor: parseMoney(get(row, headers, "VALOR")),
        status: situacao === "VENDIDO" ? "VENDIDO" : undefined,
      });
      if (!veiculoId) continue;

      const banco = str(get(row, headers, "ALIENAÇÃO"));
      if (banco && banco.toUpperCase() !== "N/A") {
        await prisma.financiamento.upsert({
          where: { veiculoId },
          create: {
            veiculoId,
            situacao,
            banco,
            contrato: str(get(row, headers, "CONTRATO")),
            dataOperacao: str(get(row, headers, "DATA OPERAÇÃO")),
            parcelasTotais: parseInt_(get(row, headers, "PARCELAS TOTAIS")),
            parcelasRemanescentes: parseInt_(get(row, headers, "PARCELAS REMANESCENTES")),
            saldoQuitacao: parseMoney(get(row, headers, "SALDO PARA QUITAÇÃO")),
            valor: parseMoney(get(row, headers, "VALOR")),
          },
          update: {
            situacao: situacao ?? undefined,
            banco,
            contrato: str(get(row, headers, "CONTRATO")) ?? undefined,
            dataOperacao: str(get(row, headers, "DATA OPERAÇÃO")) ?? undefined,
            parcelasTotais: parseInt_(get(row, headers, "PARCELAS TOTAIS")) ?? undefined,
            parcelasRemanescentes:
              parseInt_(get(row, headers, "PARCELAS REMANESCENTES")) ?? undefined,
            saldoQuitacao: parseMoney(get(row, headers, "SALDO PARA QUITAÇÃO")) ?? undefined,
          },
        });
      }
      count++;
    }
    console.log(`GOV: ${count} veículos processados`);
  }

  // 4. MOVIM. SAÍDA DE BENS_FROTA (vendidos)
  {
    const rows = sheetRows(wb, "MOVIM. SAÍDA DE BENS_FROTA");
    const { headerIdx, headers } = findHeaderRow(rows, "VENDEDOR");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const placa = normalizePlaca(get(row, headers, "PLACA"));
      if (!placa) continue;

      const empresaNome = str(get(row, headers, "VENDEDOR"));
      const docCnpj = str(get(row, headers, "DOC CNPJ"));
      const empresaId = await resolveEmpresa(empresaNome, docCnpj);

      const veiculoId = await upsertVeiculo(placa, {
        empresaId,
        responsavelTexto: empresaNome,
        docCnpj,
        carroceria: str(get(row, headers, "CARROCERIA")),
        marcaModeloVersao: str(get(row, headers, "MARCA / MODELO / VERSÃO")),
        renavam: str(get(row, headers, "RENAVAN")),
        chassi: str(get(row, headers, "CHASSI")),
        cor: str(get(row, headers, "COR")),
        status: "VENDIDO",
      });
      if (!veiculoId) continue;

      const valor = parseMoney(get(row, headers, "R$"));
      const comprador = str(get(row, headers, "COMPRADOR"));
      if (valor || comprador) {
        await prisma.venda.upsert({
          where: { veiculoId },
          create: { veiculoId, comprador, valor },
          update: { comprador: comprador ?? undefined, valor: valor ?? undefined },
        });
      }
      count++;
    }
    console.log(`MOVIM. SAÍDA DE BENS_FROTA: ${count} veículos processados`);
  }

  // 5. ALUGADO_DEVOLVIDO
  {
    const rows = sheetRows(wb, "ALUGADO_DEVOLVIDO");
    const { headerIdx, headers } = findHeaderRow(rows, "SITUAÇÃO");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const placa = normalizePlaca(get(row, headers, "PLACA"));
      if (!placa) continue;

      const locadora = str(get(row, headers, "RESPONSÁVEL"));
      const situacao = str(get(row, headers, "SITUAÇÃO"));
      const docCnpj = str(get(row, headers, "DOC CNPJ"));

      const veiculoId = await upsertVeiculo(placa, {
        responsavelTexto: locadora,
        docCnpj,
        carroceria: str(get(row, headers, "CARROCERIA")),
        marcaModeloVersao: str(get(row, headers, "MARCA / MODELO / VERSÃO")),
        renavam: str(get(row, headers, "RENAVAN")),
        chassi: str(get(row, headers, "CHASSI")),
        cor: str(get(row, headers, "COR")),
        status: situacao === "DEVOLVIDO" ? "DEVOLVIDO" : "ALUGADO",
      });
      if (!veiculoId) continue;

      await prisma.locacao.upsert({
        where: { veiculoId },
        create: {
          veiculoId,
          locadora,
          situacao,
          valorMensal: parseMoney(get(row, headers, "VL MENSAL")),
        },
        update: {
          locadora: locadora ?? undefined,
          situacao: situacao ?? undefined,
          valorMensal: parseMoney(get(row, headers, "VL MENSAL")) ?? undefined,
        },
      });
      count++;
    }
    console.log(`ALUGADO_DEVOLVIDO: ${count} veículos processados`);
  }

  // 6. PLACAS APREENDIDAS
  {
    const rows = sheetRows(wb, "PLACAS APREENDIDAS");
    const { headerIdx, headers } = findHeaderRow(rows, "PLACA");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const placa = normalizePlaca(get(row, headers, "PLACA"));
      if (!placa) continue;

      const empresaNome = str(get(row, headers, "RESPONSÁVEL"));
      const docCnpj = str(get(row, headers, "DOC CNPJ"));
      const empresaId = await resolveEmpresa(empresaNome, docCnpj);

      const veiculoId = await upsertVeiculo(placa, {
        empresaId,
        responsavelTexto: empresaNome,
        docCnpj,
        carroceria: str(get(row, headers, "CARROCERIA")),
        renavam: str(get(row, headers, "RENAVAN")),
        chassi: str(get(row, headers, "CHASSI")),
        status: "APREENDIDO",
      });
      if (veiculoId) count++;
    }
    console.log(`PLACAS APREENDIDAS: ${count} veículos processados`);
  }

  // 7. CARTÕES DESPESA
  {
    const rows = sheetRows(wb, "CARTÕES DESPESA");
    const { headerIdx, headers } = findHeaderRow(rows, "Nome impresso");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const nomeImpresso = str(get(row, headers, "Nome impresso"));
      if (!nomeImpresso) continue;

      const placa = normalizePlaca(nomeImpresso);
      const veiculo = placa ? await prisma.veiculo.findUnique({ where: { placa } }) : null;

      await prisma.cartaoDespesa.create({
        data: {
          nomeImpresso,
          numeroCartao: str(get(row, headers, "Número do cartão")),
          frotaNumero: str(get(row, headers, "Frota")),
          veiculoId: veiculo?.id,
        },
      });
      count++;
    }
    console.log(`CARTÕES DESPESA: ${count} cartões importados`);
  }

  // 8. CONJ INPASA (conjuntos)
  {
    const rows = sheetRows(wb, "CONJ INPASA");
    const { headerIdx, headers } = findHeaderRow(rows, "CONJUNTO");
    let count = 0;
    for (const row of rows.slice(headerIdx + 1)) {
      const cavalo = str(get(row, headers, "CAVALO"));
      const tanqueD = str(get(row, headers, "TANQUE DIANTEIRO"));
      const tanqueT = str(get(row, headers, "TANQUE TRASEIRO"));
      if (!cavalo && !tanqueD && !tanqueT) continue;

      await prisma.conjuntoInpasa.create({
        data: {
          numero: str(get(row, headers, "CONJUNTO")),
          cavaloPlaca: normalizePlaca(cavalo),
          tanqueDianteiroPlaca: normalizePlaca(tanqueD),
          tanqueTraseiroPlaca: normalizePlaca(tanqueT),
          valor: parseMoney(get(row, headers, "VALOR")),
          transportador: str(get(row, headers, "TRANSPORTADOR")),
        },
      });
      count++;
    }
    console.log(`CONJ INPASA: ${count} conjuntos importados`);
  }

  // 9. IPVA / Licenciamento por ano
  const impostoSheets: { sheet: string; ano: number; marker: string }[] = [
    { sheet: "IPVA_LICENCIAMENTOS_2024", ano: 2024, marker: "VENCIMENTO" },
    { sheet: "IPVA-LICENCIAMENTOS_2025", ano: 2025, marker: "OBSERVAÇÕES" },
    { sheet: "IPVA-LICENCIAMENTOS_2026", ano: 2026, marker: "CONFERE" },
  ];

  for (const { sheet, ano, marker } of impostoSheets) {
    const rows = sheetRows(wb, sheet);
    if (rows.length === 0) continue;
    const { headerIdx, headers } = findHeaderRow(rows, marker);
    let count = 0;

    for (const row of rows.slice(headerIdx + 1)) {
      const placa = normalizePlaca(get(row, headers, "PLACA"));
      if (!placa) continue;

      const empresaNome = str(get(row, headers, "RESPONSÁVEL"));
      const docCnpj = str(get(row, headers, "DOC CNPJ"));
      const empresaId = await resolveEmpresa(empresaNome, docCnpj);

      const veiculoId = await upsertVeiculo(placa, {
        empresaId,
        responsavelTexto: empresaNome,
        docCnpj,
        carroceria: str(get(row, headers, "CARROCERIA")),
        renavam: str(get(row, headers, "RENAVAN")),
        chassi: str(get(row, headers, "CHASSI")),
      });
      if (!veiculoId) continue;

      const licenciamentoVencimento = str(get(row, headers, "VENCIMENTO"));
      const licenciamentoValorRaw = get(row, headers, "VALOR R$") ?? get(row, headers, "VALOR");
      const licenciamentoValor = parseMoney(licenciamentoValorRaw);
      const ipvaVencimento =
        str(get(row, headers, "VENCIMENTO2")) || str(get(row, headers, "1º VENCIMENTO"));
      const multasValor =
        parseMoney(get(row, headers, "MULTAS R$")) ??
        parseMoney(get(row, headers, " MULTAS DE TRANSITO "));
      const observacoes =
        str(get(row, headers, "OBSERVAÇÕES")) || str(get(row, headers, "CONFERE"));
      const pagamentosMensais = extractPagamentos(row, headers);

      await prisma.impostoAnual.upsert({
        where: { veiculoId_ano: { veiculoId, ano } },
        create: {
          veiculoId,
          ano,
          licenciamentoVencimento,
          licenciamentoValor,
          ipvaVencimento,
          multasValor,
          observacoes,
          pagamentosMensais,
        },
        update: {
          licenciamentoVencimento: licenciamentoVencimento ?? undefined,
          licenciamentoValor: licenciamentoValor ?? undefined,
          ipvaVencimento: ipvaVencimento ?? undefined,
          multasValor: multasValor ?? undefined,
          observacoes: observacoes ?? undefined,
          pagamentosMensais: pagamentosMensais ?? undefined,
        },
      });
      count++;
    }
    console.log(`${sheet}: ${count} lançamentos de imposto importados`);
  }

  const totalVeiculos = await prisma.veiculo.count();
  console.log(`\nImportação concluída. Total de veículos no banco: ${totalVeiculos}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
