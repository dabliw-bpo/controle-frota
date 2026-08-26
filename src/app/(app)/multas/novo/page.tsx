import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MultaForm from "@/components/MultaForm";
import { criarMulta } from "../actions";

export default async function NovaMultaPage() {
  const [veiculos, motoristas] = await Promise.all([
    prisma.veiculo.findMany({ select: { id: true, placa: true }, orderBy: { placa: "asc" } }),
    prisma.motorista.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/multas" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Multas
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Nova multa</h1>
        <p className="text-slate-500 text-sm mt-1">Registre uma multa de trânsito</p>
      </div>

      <MultaForm action={criarMulta} veiculos={veiculos} motoristas={motoristas} submitLabel="Cadastrar multa" />
    </div>
  );
}
