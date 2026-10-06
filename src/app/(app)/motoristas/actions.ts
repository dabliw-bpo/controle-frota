"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { onlyDigits } from "@/lib/cpf";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || user.role === "VISUALIZADOR") {
    throw new Error("Sem permissão para esta ação.");
  }
  return user;
}

async function resolveVeiculoId(placaRaw: string | null): Promise<string | null | undefined> {
  if (placaRaw === null) return null; // campo limpo: desvincula
  const placa = placaRaw.trim().toUpperCase();
  if (!placa) return null;

  const veiculo = await prisma.veiculo.findUnique({ where: { placa } });
  if (!veiculo) {
    throw new Error(`Placa "${placa}" não encontrada na frota.`);
  }
  return veiculo.id;
}

function buildData(formData: FormData) {
  const cpfRaw = str(formData, "cpf");
  return {
    nome: str(formData, "nome"),
    sexo: str(formData, "sexo"),
    cadastro: str(formData, "cadastro"),
    admissao: str(formData, "admissao"),
    cpf: cpfRaw ? onlyDigits(cpfRaw) : null,
    cargo: str(formData, "cargo"),
    email: str(formData, "email"),
    whatsapp: str(formData, "whatsapp"),
    pix: str(formData, "pix"),
  };
}

export async function criarMotorista(formData: FormData) {
  await requireEditor();

  const nome = str(formData, "nome");
  if (!nome) throw new Error("Nome é obrigatório.");

  const veiculoId = await resolveVeiculoId(str(formData, "placa"));

  const motorista = await prisma.motorista.create({
    data: { ...buildData(formData), nome, veiculoId: veiculoId || null },
  });

  revalidatePath("/motoristas");
  redirect(`/motoristas/${motorista.id}`);
}

export async function atualizarMotorista(motoristaId: string, formData: FormData) {
  await requireEditor();

  const nome = str(formData, "nome");
  if (!nome) throw new Error("Nome é obrigatório.");

  const veiculoId = await resolveVeiculoId(str(formData, "placa"));

  await prisma.motorista.update({
    where: { id: motoristaId },
    data: { ...buildData(formData), nome, veiculoId },
  });

  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath("/motoristas");
}

export async function definirAtivoMotorista(motoristaId: string, ativo: boolean) {
  await requireEditor();
  await prisma.motorista.update({ where: { id: motoristaId }, data: { ativo } });
  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath("/motoristas");
  revalidatePath("/faturamento");
}

export async function definirComissaoMotorista(motoristaId: string, formData: FormData) {
  await requireEditor();
  const percentual = parseFloat(String(formData.get("percentual") ?? "").replace(",", "."));
  const mes = Number(formData.get("mes"));
  const ano = Number(formData.get("ano"));
  if (Number.isNaN(percentual) || percentual < 0 || percentual > 100) throw new Error("Comissão deve estar entre 0 e 100%.");
  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    throw new Error("Informe um mês e ano válidos.");
  }
  await prisma.comissaoMotorista.upsert({
    where: { motoristaId_ano_mes: { motoristaId, ano, mes } },
    create: { motoristaId, ano, mes, percentual },
    update: { percentual },
  });
  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath("/faturamento");
  revalidatePath("/dashboard");
}

export async function removerComissaoMotorista(motoristaId: string, comissaoId: string) {
  await requireEditor();
  await prisma.comissaoMotorista.deleteMany({ where: { id: comissaoId, motoristaId } });
  revalidatePath(`/motoristas/${motoristaId}`);
  revalidatePath("/faturamento");
  revalidatePath("/dashboard");
}

export async function excluirMotorista(motoristaId: string) {
  await requireEditor();
  await prisma.motorista.delete({ where: { id: motoristaId } });
  revalidatePath("/motoristas");
  redirect("/motoristas");
}
