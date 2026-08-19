import { prisma } from "@/lib/prisma";
import MotoristaForm from "@/components/MotoristaForm";
import { criarMotorista } from "../actions";

export default async function NovoMotoristaPage() {
  const veiculos = await prisma.veiculo.findMany({ select: { placa: true }, orderBy: { placa: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo motorista</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um motorista</p>
      </div>

      <MotoristaForm
        action={criarMotorista}
        placas={veiculos.map((v) => v.placa)}
        submitLabel="Cadastrar motorista"
      />
    </div>
  );
}
