import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATUS_INICIAIS = [
  { chave: "ATIVO", label: "Ativo", cor: "emerald", ordem: 0 },
  { chave: "MANUTENCAO", label: "Manutenção", cor: "amber", ordem: 1 },
  { chave: "PARADO", label: "Parado", cor: "gray", ordem: 2 },
  { chave: "ALUGADO", label: "Alugado", cor: "purple", ordem: 3 },
  { chave: "VENDIDO", label: "Vendido", cor: "slate", ordem: 4 },
  { chave: "APREENDIDO", label: "Apreendido", cor: "red", ordem: 5 },
  { chave: "DEVOLVIDO", label: "Devolvido", cor: "orange", ordem: 6 },
];

const TIPOS_INICIAIS = ["CAVALO", "CARRETA", "DOLLY", "CARRO", "TANQUE", "BASCULANTE", "ABERTA"];

const CARGOS_INICIAIS = ["MOTORISTA"];

const TIPOS_MOTORISTA_INICIAIS = ["CLT", "PJ"];

async function main() {
  await prisma.configuracao.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", nomeSistema: "Controle de Frota", subtitulo: null },
  });

  for (const s of STATUS_INICIAIS) {
    await prisma.statusVeiculo.upsert({
      where: { chave: s.chave },
      update: {},
      create: s,
    });
  }

  for (let i = 0; i < TIPOS_INICIAIS.length; i++) {
    await prisma.tipoVeiculo.upsert({
      where: { nome: TIPOS_INICIAIS[i] },
      update: {},
      create: { nome: TIPOS_INICIAIS[i], ordem: i },
    });
  }

  for (let i = 0; i < CARGOS_INICIAIS.length; i++) {
    await prisma.cargoMotorista.upsert({
      where: { nome: CARGOS_INICIAIS[i] },
      update: {},
      create: { nome: CARGOS_INICIAIS[i], ordem: i },
    });
  }

  for (let i = 0; i < TIPOS_MOTORISTA_INICIAIS.length; i++) {
    await prisma.tipoMotorista.upsert({
      where: { nome: TIPOS_MOTORISTA_INICIAIS[i] },
      update: {},
      create: { nome: TIPOS_MOTORISTA_INICIAIS[i], ordem: i },
    });
  }

  console.log("Configurações iniciais criadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
