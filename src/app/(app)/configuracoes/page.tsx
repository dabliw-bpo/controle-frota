import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getStatusList,
  getTipoList,
  getCargoList,
  getTipoMotoristaList,
  getConfiguracao,
  corParaClasses,
  CORES_DISPONIVEIS,
} from "@/lib/settings";
import {
  salvarCabecalho,
  criarStatus,
  atualizarStatus,
  excluirStatus,
  criarTipo,
  excluirTipo,
  criarCargo,
  excluirCargo,
  criarTipoMotorista,
  excluirTipoMotorista,
} from "./actions";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [config, statusList, tipoList, cargoList, tipoMotoristaList] = await Promise.all([
    getConfiguracao(),
    getStatusList(),
    getTipoList(),
    getCargoList(),
    getTipoMotoristaList(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie os cadastros e opções usadas em todo o sistema
        </p>
      </div>

      {/* Cabeçalho do sistema */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Cabeçalho do sistema</h3>
        <form action={salvarCabecalho} className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Nome do sistema</span>
            <input
              name="nomeSistema"
              defaultValue={config.nomeSistema}
              required
              className="input min-w-[220px]"
            />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Subtítulo (opcional)</span>
            <input
              name="subtitulo"
              defaultValue={config.subtitulo ?? ""}
              placeholder="Ex: nome da empresa"
              className="input min-w-[220px]"
            />
          </label>
          <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2 h-[38px]">
            Salvar
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2">
          Aparece no menu lateral e na tela de login.
        </p>
      </div>

      {/* Status de veículo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Status de veículo</h3>
        <div className="space-y-2 mb-4">
          {statusList.map((s) => (
            <div key={s.id} className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${corParaClasses(
                  s.cor
                )} min-w-[110px] justify-center`}
              >
                {s.label}
              </span>
              <form action={atualizarStatus.bind(null, s.id)} className="flex gap-2 items-center flex-1 flex-wrap">
                <span className="text-xs text-slate-400 font-mono">{s.chave}</span>
                <input name="label" defaultValue={s.label} className="input max-w-[160px]" />
                <select name="cor" defaultValue={s.cor} className="input max-w-[130px]">
                  {CORES_DISPONIVEIS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button className="text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
                  Salvar
                </button>
              </form>
              <form action={excluirStatus.bind(null, s.id)}>
                <button className="text-xs text-red-600 hover:underline">remover</button>
              </form>
            </div>
          ))}
          {statusList.length === 0 && <p className="text-sm text-slate-400">Nenhum status cadastrado.</p>}
        </div>
        <form action={criarStatus} className="flex gap-2 flex-wrap items-end border-t border-slate-100 pt-4">
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Chave</span>
            <input name="chave" placeholder="Ex: EM_VIAGEM" className="input max-w-[160px]" required />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Rótulo</span>
            <input name="label" placeholder="Ex: Em viagem" className="input max-w-[160px]" required />
          </label>
          <label className="text-sm">
            <span className="block font-medium text-slate-700 mb-1">Cor</span>
            <select name="cor" defaultValue="gray" className="input max-w-[130px]">
              {CORES_DISPONIVEIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 h-[38px]">
            + Novo status
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tipos de veículo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Tipos de veículo</h3>
          <div className="space-y-2 mb-4">
            {tipoList.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{t.nome}</span>
                <form action={excluirTipo.bind(null, t.id)}>
                  <button className="text-xs text-red-600 hover:underline">remover</button>
                </form>
              </div>
            ))}
            {tipoList.length === 0 && <p className="text-sm text-slate-400">Nenhum tipo cadastrado.</p>}
          </div>
          <form action={criarTipo} className="flex gap-2 border-t border-slate-100 pt-4">
            <input name="nome" placeholder="Ex: BAÚ" className="input" required />
            <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap">
              + Adicionar
            </button>
          </form>
        </div>

        {/* Cargos de motorista */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Cargos de motorista</h3>
          <div className="space-y-2 mb-4">
            {cargoList.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{c.nome}</span>
                <form action={excluirCargo.bind(null, c.id)}>
                  <button className="text-xs text-red-600 hover:underline">remover</button>
                </form>
              </div>
            ))}
            {cargoList.length === 0 && <p className="text-sm text-slate-400">Nenhum cargo cadastrado.</p>}
          </div>
          <form action={criarCargo} className="flex gap-2 border-t border-slate-100 pt-4">
            <input name="nome" placeholder="Ex: AJUDANTE" className="input" required />
            <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap">
              + Adicionar
            </button>
          </form>
        </div>

        {/* Tipos de motorista (tipo de cadastro) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Tipos de motorista</h3>
          <div className="space-y-2 mb-4">
            {tipoMotoristaList.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{t.nome}</span>
                <form action={excluirTipoMotorista.bind(null, t.id)}>
                  <button className="text-xs text-red-600 hover:underline">remover</button>
                </form>
              </div>
            ))}
            {tipoMotoristaList.length === 0 && (
              <p className="text-sm text-slate-400">Nenhum tipo cadastrado.</p>
            )}
          </div>
          <form action={criarTipoMotorista} className="flex gap-2 border-t border-slate-100 pt-4">
            <input name="nome" placeholder="Ex: TERCEIRIZADO" className="input" required />
            <button className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap">
              + Adicionar
            </button>
          </form>
        </div>
      </div>

      {/* Usuários */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Usuários</h3>
          <p className="text-sm text-slate-500 mt-1">Crie, ative/desative ou remova acessos ao sistema</p>
        </div>
        <Link
          href="/usuarios"
          className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Gerenciar usuários
        </Link>
      </div>
    </div>
  );
}
