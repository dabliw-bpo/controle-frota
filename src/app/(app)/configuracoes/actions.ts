"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem alterar configurações.");
  }
  return user;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.trim();
}

function revalidateConfig() {
  revalidatePath("/configuracoes");
  revalidatePath("/veiculos");
  revalidatePath("/veiculos/novo");
  revalidatePath("/motoristas");
  revalidatePath("/motoristas/novo");
  revalidatePath("/dashboard");
}

export async function salvarCabecalho(formData: FormData) {
  await requireAdmin();
  const nomeSistema = str(formData, "nomeSistema") || "Controle de Frota";
  const subtitulo = str(formData, "subtitulo");

  await prisma.configuracao.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", nomeSistema, subtitulo },
    update: { nomeSistema, subtitulo },
  });

  revalidateConfig();
  revalidatePath("/login");
}

export async function criarStatus(formData: FormData) {
  await requireAdmin();
  const chave = str(formData, "chave")?.toUpperCase().replace(/\s+/g, "_");
  const label = str(formData, "label");
  const cor = str(formData, "cor") || "gray";
  if (!chave || !label) throw new Error("Chave e rótulo são obrigatórios.");

  const max = await prisma.statusVeiculo.aggregate({ _max: { ordem: true } });
  await prisma.statusVeiculo.create({
    data: { chave, label, cor, ordem: (max._max.ordem ?? -1) + 1 },
  });

  revalidateConfig();
}

export async function atualizarStatus(id: string, formData: FormData) {
  await requireAdmin();
  const label = str(formData, "label");
  const cor = str(formData, "cor") || "gray";
  if (!label) throw new Error("Rótulo é obrigatório.");

  await prisma.statusVeiculo.update({ where: { id }, data: { label, cor } });
  revalidateConfig();
}

export async function excluirStatus(id: string) {
  await requireAdmin();
  await prisma.statusVeiculo.delete({ where: { id } });
  revalidateConfig();
}

export async function criarTipo(formData: FormData) {
  await requireAdmin();
  const nome = str(formData, "nome")?.toUpperCase();
  if (!nome) throw new Error("Nome é obrigatório.");

  const max = await prisma.tipoVeiculo.aggregate({ _max: { ordem: true } });
  await prisma.tipoVeiculo.create({ data: { nome, ordem: (max._max.ordem ?? -1) + 1 } });
  revalidateConfig();
}

export async function excluirTipo(id: string) {
  await requireAdmin();
  await prisma.tipoVeiculo.delete({ where: { id } });
  revalidateConfig();
}

export async function criarCargo(formData: FormData) {
  await requireAdmin();
  const nome = str(formData, "nome")?.toUpperCase();
  if (!nome) throw new Error("Nome é obrigatório.");

  const max = await prisma.cargoMotorista.aggregate({ _max: { ordem: true } });
  await prisma.cargoMotorista.create({ data: { nome, ordem: (max._max.ordem ?? -1) + 1 } });
  revalidateConfig();
}

export async function excluirCargo(id: string) {
  await requireAdmin();
  await prisma.cargoMotorista.delete({ where: { id } });
  revalidateConfig();
}

export async function criarTipoMotorista(formData: FormData) {
  await requireAdmin();
  const nome = str(formData, "nome")?.toUpperCase();
  if (!nome) throw new Error("Nome é obrigatório.");

  const max = await prisma.tipoMotorista.aggregate({ _max: { ordem: true } });
  await prisma.tipoMotorista.create({ data: { nome, ordem: (max._max.ordem ?? -1) + 1 } });
  revalidateConfig();
}

export async function excluirTipoMotorista(id: string) {
  await requireAdmin();
  await prisma.tipoMotorista.delete({ where: { id } });
  revalidateConfig();
}
