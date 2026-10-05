import Link from "next/link";
import ClienteForm from "@/components/ClienteForm";
import { criarCliente } from "../actions";

export default function NovoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/faturamento/clientes" className="text-sm text-brand-600 hover:underline">
          ← Voltar para Clientes
        </Link>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">Financeiro</p>
        <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">Novo cliente</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um cliente</p>
      </div>

      <ClienteForm action={criarCliente} submitLabel="Cadastrar cliente" />
    </div>
  );
}
