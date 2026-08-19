"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ROLES } from "@/lib/constants";
import { onlyDigits, isValidCpf } from "@/lib/cpf";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
  return user;
}

export async function criarUsuario(formData: FormData) {
  await requireAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const cpf = onlyDigits(String(formData.get("cpf") || ""));
  const senha = String(formData.get("senha") || "");
  const role = String(formData.get("role") || "VISUALIZADOR");

  if (!nome || senha.length < 6) {
    throw new Error("Preencha nome, CPF e uma senha com ao menos 6 caracteres.");
  }
  if (!isValidCpf(cpf)) {
    throw new Error("CPF inválido.");
  }
  if (!ROLES.includes(role as any)) {
    throw new Error("Perfil inválido.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.usuario.create({
    data: { nome, cpf, senhaHash, role },
  });

  revalidatePath("/usuarios");
}

export async function alternarUsuarioAtivo(usuarioId: string, ativo: boolean) {
  await requireAdmin();
  await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo } });
  revalidatePath("/usuarios");
}

export async function excluirUsuario(usuarioId: string) {
  const admin = await requireAdmin();
  if (admin.id === usuarioId) {
    throw new Error("Você não pode excluir seu próprio usuário.");
  }
  await prisma.usuario.delete({ where: { id: usuarioId } });
  revalidatePath("/usuarios");
}
