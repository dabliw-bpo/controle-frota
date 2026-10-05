import VeiculoForm from "@/components/VeiculoForm";
import { criarVeiculo } from "../actions";

export default function NovoVeiculoPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-brand-500">Frota</p>
        <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">Novo veículo</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um veículo na frota</p>
      </div>

      <VeiculoForm action={criarVeiculo} submitLabel="Cadastrar veículo" />
    </div>
  );
}
