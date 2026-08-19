import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCpf } from "@/lib/cpf";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });

  const motoristas = await prisma.motorista.findMany({
    include: { veiculo: true },
    orderBy: { nome: "asc" },
  });

  const csv = toCsv(
    ["Nome", "CPF", "Cargo", "Tipo", "Admissão", "WhatsApp", "E-mail", "Placa"],
    motoristas.map((m) => [
      m.nome,
      m.cpf ? formatCpf(m.cpf) : null,
      m.cargo,
      m.cadastro,
      m.admissao,
      m.whatsapp,
      m.email,
      m.veiculo?.placa,
    ])
  );

  return csvResponse("motoristas.csv", csv);
}
