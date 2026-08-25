import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ClienteForm from "@/components/ClienteForm";
import { atualizarCliente, excluirCliente } from "../actions";

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) notFound();

  const atualizarAction = atualizarCliente.bind(null, cliente.id);
  const excluirAction = excluirCliente.bind(null, cliente.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/faturamento/clientes" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Clientes
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{cliente.nome}</h1>
          <p className="text-slate-500 text-sm mt-1">{cliente.cnpj || "CNPJ não informado"}</p>
        </div>
        <form action={excluirAction}>
          <button className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Excluir cliente
          </button>
        </form>
      </div>

      <ClienteForm
        action={atualizarAction}
        submitLabel="Salvar alterações"
        initial={{
          nome: cliente.nome,
          cnpj: cliente.cnpj,
          cidade: cliente.cidade,
          uf: cliente.uf,
          telefone: cliente.telefone,
          observacoes: cliente.observacoes,
        }}
      />
    </div>
  );
}
