import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Paleta fechada de cores para os badges de status. As classes precisam
// aparecer como texto literal em algum arquivo varrido pelo Tailwind (aqui
// mesmo) para que o CSS delas seja gerado, mesmo vindo de dados do banco.
export const COR_PALETA: Record<string, string> = {
  gray: "bg-gray-100 text-gray-800",
  slate: "bg-slate-200 text-slate-700",
  emerald: "bg-emerald-100 text-emerald-800",
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
  orange: "bg-orange-100 text-orange-800",
  pink: "bg-pink-100 text-pink-800",
  indigo: "bg-indigo-100 text-indigo-800",
  teal: "bg-teal-100 text-teal-800",
  cyan: "bg-cyan-100 text-cyan-800",
};

export const CORES_DISPONIVEIS = Object.keys(COR_PALETA);

export function corParaClasses(cor: string | null | undefined): string {
  return COR_PALETA[cor ?? ""] ?? COR_PALETA.gray;
}

export const getStatusList = cache(async () => {
  return prisma.statusVeiculo.findMany({ orderBy: { ordem: "asc" } });
});

export const getTipoList = cache(async () => {
  return prisma.tipoVeiculo.findMany({ orderBy: { ordem: "asc" } });
});

export const getCargoList = cache(async () => {
  return prisma.cargoMotorista.findMany({ orderBy: { ordem: "asc" } });
});

export const getTipoMotoristaList = cache(async () => {
  return prisma.tipoMotorista.findMany({ orderBy: { ordem: "asc" } });
});

export const getConfiguracao = cache(async () => {
  const existente = await prisma.configuracao.findUnique({ where: { id: "singleton" } });
  if (existente) return existente;
  return prisma.configuracao.create({
    data: { id: "singleton", nomeSistema: "Controle de Frota" },
  });
});
