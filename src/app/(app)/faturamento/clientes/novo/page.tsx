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
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Novo cliente</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um cliente</p>
      </div>

      <ClienteForm action={criarCliente} submitLabel="Cadastrar cliente" />
    </div>
  );
}
