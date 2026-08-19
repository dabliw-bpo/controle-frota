import VeiculoForm from "@/components/VeiculoForm";
import { criarVeiculo } from "../actions";

export default function NovoVeiculoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo veículo</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um veículo na frota</p>
      </div>

      <VeiculoForm action={criarVeiculo} submitLabel="Cadastrar veículo" />
    </div>
  );
}
