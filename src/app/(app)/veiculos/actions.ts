"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function num(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || user.role === "VISUALIZADOR") {
    throw new Error("Sem permissão para esta ação.");
  }
  return user;
}

async function resolveEmpresaId(nomeEmpresa: string | null, cnpj: string | null) {
  if (!nomeEmpresa) return null;
  let empresa = await prisma.empresa.findFirst({
    where: { nome: nomeEmpresa },
  });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: { nome: nomeEmpresa, cnpj: cnpj || undefined },
    });
  }
  return empresa.id;
}

export async function criarVeiculo(formData: FormData) {
  await requireEditor();

  const placa = str(formData, "placa");
  if (!placa) throw new Error("Placa é obrigatória.");

  const empresaNome = str(formData, "empresaNome");
  const docCnpj = str(formData, "docCnpj");
  const empresaId = await resolveEmpresaId(empresaNome, docCnpj);

  const veiculo = await prisma.veiculo.create({
    data: {
      placa: placa.toUpperCase(),
      status: str(formData, "status") || "ATIVO",
      empresaId,
      responsavelTexto: empresaNome,
      docCnpj,
      numeroPatrimonio: str(formData, "numeroPatrimonio"),
      carroceria: str(formData, "carroceria"),
      fabricacaoAno: str(formData, "fabricacaoAno"),
      marcaModeloVersao: str(formData, "marcaModeloVersao"),
      renavam: str(formData, "renavam"),
      chassi: str(formData, "chassi"),
      cor: str(formData, "cor"),
      valor: num(formData, "valor"),
      motorista: str(formData, "motorista"),
      rastreador: str(formData, "rastreador"),
      antt: str(formData, "antt"),
      notaFiscal: str(formData, "notaFiscal"),
      rotaAtual: str(formData, "rotaAtual"),
      produtoAtual: str(formData, "produtoAtual"),
      ocorrencias: str(formData, "ocorrencias"),
      observacoes: str(formData, "observacoes"),
    },
  });

  revalidatePath("/veiculos");
  redirect(`/veiculos/${veiculo.id}`);
}

export async function atualizarVeiculo(veiculoId: string, formData: FormData) {
  await requireEditor();

  const placa = str(formData, "placa");
  if (!placa) throw new Error("Placa é obrigatória.");

  const empresaNome = str(formData, "empresaNome");
  const docCnpj = str(formData, "docCnpj");
  const empresaId = await resolveEmpresaId(empresaNome, docCnpj);

  await prisma.veiculo.update({
    where: { id: veiculoId },
    data: {
      placa: placa.toUpperCase(),
      status: str(formData, "status") || "ATIVO",
      empresaId,
      responsavelTexto: empresaNome,
      docCnpj,
      numeroPatrimonio: str(formData, "numeroPatrimonio"),
      carroceria: str(formData, "carroceria"),
      fabricacaoAno: str(formData, "fabricacaoAno"),
      marcaModeloVersao: str(formData, "marcaModeloVersao"),
      renavam: str(formData, "renavam"),
      chassi: str(formData, "chassi"),
      cor: str(formData, "cor"),
      valor: num(formData, "valor"),
      motorista: str(formData, "motorista"),
      rastreador: str(formData, "rastreador"),
      antt: str(formData, "antt"),
      notaFiscal: str(formData, "notaFiscal"),
      rotaAtual: str(formData, "rotaAtual"),
      produtoAtual: str(formData, "produtoAtual"),
      ocorrencias: str(formData, "ocorrencias"),
      observacoes: str(formData, "observacoes"),
    },
  });

  revalidatePath(`/veiculos/${veiculoId}`);
  revalidatePath("/veiculos");
}

export async function excluirVeiculo(veiculoId: string) {
  await requireEditor();
  await prisma.veiculo.delete({ where: { id: veiculoId } });
  revalidatePath("/veiculos");
  redirect("/veiculos");
}

export async function salvarFinanciamento(veiculoId: string, formData: FormData) {
  await requireEditor();

  await prisma.financiamento.upsert({
    where: { veiculoId },
    create: {
      veiculoId,
      situacao: str(formData, "situacao"),
      banco: str(formData, "banco"),
      contrato: str(formData, "contrato"),
      dataOperacao: str(formData, "dataOperacao"),
      parcelasTotais: num(formData, "parcelasTotais"),
      parcelasRemanescentes: num(formData, "parcelasRemanescentes"),
      saldoQuitacao: num(formData, "saldoQuitacao"),
      valor: num(formData, "valor"),
    },
    update: {
      situacao: str(formData, "situacao"),
      banco: str(formData, "banco"),
      contrato: str(formData, "contrato"),
      dataOperacao: str(formData, "dataOperacao"),
      parcelasTotais: num(formData, "parcelasTotais"),
      parcelasRemanescentes: num(formData, "parcelasRemanescentes"),
      saldoQuitacao: num(formData, "saldoQuitacao"),
      valor: num(formData, "valor"),
    },
  });

  revalidatePath(`/veiculos/${veiculoId}`);
}

export async function salvarSeguro(veiculoId: string, formData: FormData) {
  await requireEditor();

  await prisma.seguro.upsert({
    where: { veiculoId },
    create: {
      veiculoId,
      seguradora: str(formData, "seguradora"),
      apolice: str(formData, "apolice"),
      valor: num(formData, "valor"),
    },
    update: {
      seguradora: str(formData, "seguradora"),
      apolice: str(formData, "apolice"),
      valor: num(formData, "valor"),
    },
  });

  revalidatePath(`/veiculos/${veiculoId}`);
}

export async function adicionarCartao(veiculoId: string, formData: FormData) {
  await requireEditor();

  const nomeImpresso = str(formData, "nomeImpresso");
  if (!nomeImpresso) throw new Error("Nome impresso é obrigatório.");

  await prisma.cartaoDespesa.create({
    data: {
      veiculoId,
      nomeImpresso,
      numeroCartao: str(formData, "numeroCartao"),
      frotaNumero: str(formData, "frotaNumero"),
    },
  });

  revalidatePath(`/veiculos/${veiculoId}`);
}

export async function removerCartao(cartaoId: string, veiculoId: string) {
  await requireEditor();
  await prisma.cartaoDespesa.delete({ where: { id: cartaoId } });
  revalidatePath(`/veiculos/${veiculoId}`);
}

export async function salvarImposto(veiculoId: string, formData: FormData) {
  await requireEditor();

  const ano = num(formData, "ano");
  if (!ano) throw new Error("Ano é obrigatório.");

  await prisma.impostoAnual.upsert({
    where: { veiculoId_ano: { veiculoId, ano } },
    create: {
      veiculoId,
      ano,
      licenciamentoVencimento: str(formData, "licenciamentoVencimento"),
      licenciamentoValor: num(formData, "licenciamentoValor"),
      ipvaVencimento: str(formData, "ipvaVencimento"),
      multasValor: num(formData, "multasValor"),
      observacoes: str(formData, "observacoes"),
    },
    update: {
      licenciamentoVencimento: str(formData, "licenciamentoVencimento"),
      licenciamentoValor: num(formData, "licenciamentoValor"),
      ipvaVencimento: str(formData, "ipvaVencimento"),
      multasValor: num(formData, "multasValor"),
      observacoes: str(formData, "observacoes"),
    },
  });

  revalidatePath(`/veiculos/${veiculoId}`);
  revalidatePath("/impostos");
}

export async function excluirImposto(impostoId: string, veiculoId: string) {
  await requireEditor();
  await prisma.impostoAnual.delete({ where: { id: impostoId } });
  revalidatePath(`/veiculos/${veiculoId}`);
  revalidatePath("/impostos");
}
