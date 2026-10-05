import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MotoristaForm from "@/components/MotoristaForm";
import { formatCpf } from "@/lib/cpf";
import { atualizarMotorista, definirAtivoMotorista, excluirMotorista } from "../actions";

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
  const alternarAtivoAction = definirAtivoMotorista.bind(null, motorista.id, !motorista.ativo);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-500">Pessoas</p>
          <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">{motorista.nome}
            {!motorista.ativo && (
              <span className="ml-3 align-middle inline-flex rounded-full border border-slate-300 px-2 py-0.5 text-xs font-normal text-slate-500">
                Inativo
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {motorista.cpf ? formatCpf(motorista.cpf) : "CPF não informado"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <form action={alternarAtivoAction}>
            <button className="text-sm text-slate-900 border border-slate-300 hover:border-brand-500 hover:text-brand-600 rounded-lg px-3 py-2">
              {motorista.ativo ? "Desativar motorista" : "Reativar motorista"}
            </button>
          </form>
          <form action={excluirAction}>
            <button className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Excluir motorista
            </button>
          </form>
        </div>
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
