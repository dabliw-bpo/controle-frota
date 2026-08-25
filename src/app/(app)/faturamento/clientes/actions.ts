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

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || user.role === "VISUALIZADOR") {
    throw new Error("Sem permissão para esta ação.");
  }
  return user;
}

function buildData(formData: FormData) {
  return {
    nome: str(formData, "nome"),
    cnpj: str(formData, "cnpj"),
    cidade: str(formData, "cidade"),
    uf: str(formData, "uf")?.toUpperCase() ?? null,
    telefone: str(formData, "telefone"),
    observacoes: str(formData, "observacoes"),
  };
}

export async function criarCliente(formData: FormData) {
  await requireEditor();

  const nome = str(formData, "nome");
  if (!nome) throw new Error("Nome é obrigatório.");

  const cliente = await prisma.cliente.create({
    data: { ...buildData(formData), nome },
  });

  revalidatePath("/faturamento/clientes");
  redirect(`/faturamento/clientes/${cliente.id}`);
}

export async function criarClienteRapido(nome: string): Promise<{ id: string; nome: string }> {
  await requireEditor();

  const nomeTrim = nome.trim();
  if (!nomeTrim) throw new Error("Nome é obrigatório.");

  const cliente = await prisma.cliente.create({ data: { nome: nomeTrim } });

  revalidatePath("/faturamento/clientes");
  return { id: cliente.id, nome: cliente.nome };
}

export async function atualizarCliente(clienteId: string, formData: FormData) {
  await requireEditor();

  const nome = str(formData, "nome");
  if (!nome) throw new Error("Nome é obrigatório.");

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { ...buildData(formData), nome },
  });

  revalidatePath(`/faturamento/clientes/${clienteId}`);
  revalidatePath("/faturamento/clientes");
}

export async function excluirCliente(clienteId: string) {
  await requireEditor();
  await prisma.cliente.delete({ where: { id: clienteId } });
  revalidatePath("/faturamento/clientes");
  redirect("/faturamento/clientes");
}
