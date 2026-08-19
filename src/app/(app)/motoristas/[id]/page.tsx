import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MotoristaForm from "@/components/MotoristaForm";
import { formatCpf } from "@/lib/cpf";
import { atualizarMotorista, excluirMotorista } from "../actions";

export default async function MotoristaDetalhePage({ params }: { params: { id: string } }) {
  const [motorista, veiculos] = await Promise.all([
    prisma.motorista.findUnique({
      where: { id: params.id },
      include: { veiculo: true },
    }),
    prisma.veiculo.findMany({ select: { placa: true }, orderBy: { placa: "asc" } }),
  ]);

  if (!motorista) notFound();

  const atualizarAction = atualizarMotorista.bind(null, motorista.id);
  const excluirAction = excluirMotorista.bind(null, motorista.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{motorista.nome}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {motorista.cpf ? formatCpf(motorista.cpf) : "CPF não informado"}
          </p>
        </div>
        <form action={excluirAction}>
          <button className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Excluir motorista
          </button>
        </form>
      </div>

      <MotoristaForm
        action={atualizarAction}
        submitLabel="Salvar alterações"
        placas={veiculos.map((v) => v.placa)}
        initial={{
          nome: motorista.nome,
          sexo: motorista.sexo,
          cadastro: motorista.cadastro,
          admissao: motorista.admissao,
          cpf: motorista.cpf ? formatCpf(motorista.cpf) : "",
          cargo: motorista.cargo,
          email: motorista.email,
          whatsapp: motorista.whatsapp,
          pix: motorista.pix,
          placa: motorista.veiculo?.placa,
        }}
      />
    </div>
  );
}
