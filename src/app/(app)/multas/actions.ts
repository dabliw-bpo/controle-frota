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

function buildData(formData: FormData) {
  return {
    veiculoId: str(formData, "veiculoId"),
    motoristaId: str(formData, "motoristaId"),
    tipo: str(formData, "tipo") ?? "MULTA",
    data: str(formData, "data"),
    descricao: str(formData, "descricao"),
    valor: num(formData, "valor"),
    descontarMotorista: formData.get("descontarMotorista") === "on",
    codigoBarras: str(formData, "codigoBarras"),
  };
}

export async function criarMulta(formData: FormData) {
  await requireEditor();

  const veiculoId = str(formData, "veiculoId");
  const descricao = str(formData, "descricao");
  if (!veiculoId) throw new Error("Placa é obrigatória.");
  if (!descricao) throw new Error("Descrição é obrigatória.");

  const { motoristaId, tipo, data, valor, descontarMotorista, codigoBarras } = buildData(formData);

  const multa = await prisma.multa.create({
    data: { veiculoId, motoristaId, tipo, data, descricao, valor, descontarMotorista, codigoBarras },
  });

  revalidatePath("/multas");
  redirect(`/multas/${multa.id}`);
}

export async function atualizarMulta(multaId: string, formData: FormData) {
  await requireEditor();

  const veiculoId = str(formData, "veiculoId");
  const descricao = str(formData, "descricao");
  if (!veiculoId) throw new Error("Placa é obrigatória.");
  if (!descricao) throw new Error("Descrição é obrigatória.");

  const { motoristaId, tipo, data, valor, descontarMotorista, codigoBarras } = buildData(formData);

  await prisma.multa.update({
    where: { id: multaId },
    data: { veiculoId, motoristaId, tipo, data, descricao, valor, descontarMotorista, codigoBarras },
  });

  revalidatePath(`/multas/${multaId}`);
  revalidatePath("/multas");
}

export async function excluirMulta(multaId: string) {
  await requireEditor();
  await prisma.multa.delete({ where: { id: multaId } });
  revalidatePath("/multas");
  redirect("/multas");
}
