import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_LABELS, ROLES, Role } from "@/lib/constants";
import { formatCpf } from "@/lib/cpf";
import CpfInput from "@/components/CpfInput";
import SortableTh from "@/components/SortableTh";
import { criarUsuario, alternarUsuarioAtivo, excluirUsuario } from "./actions";

const SORT_FIELDS = ["nome", "cpf", "role", "ativo"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function getOrderBy(sort: string | undefined, dir: "asc" | "desc") {
  const field: SortField = SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "nome";
  return { [field]: dir } as const;
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: { sort?: string; dir?: string };
}) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  const dir: "asc" | "desc" = searchParams.dir === "desc" ? "desc" : "asc";
  const usuarios = await prisma.usuario.findMany({ orderBy: getOrderBy(searchParams.sort, dir) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie quem tem acesso ao sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <SortableTh label="Nome" sortKey="nome" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="CPF" sortKey="cpf" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Perfil" sortKey="role" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <SortableTh label="Status" sortKey="ativo" currentSort={searchParams.sort} currentDir={dir} searchParams={searchParams} />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                <td className="px-4 py-3 text-slate-600">{formatCpf(u.cpf)}</td>
                <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[u.role as Role] ?? u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.ativo ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <form action={alternarUsuarioAtivo.bind(null, u.id, !u.ativo)} className="inline">
                    <button className="text-xs text-brand-600 hover:underline">
                      {u.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  {u.id !== me.id && (
                    <form action={excluirUsuario.bind(null, u.id)} className="inline">
                      <button className="text-xs text-red-600 hover:underline">Excluir</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-lg">
        <h3 className="font-semibold text-slate-900 mb-4">Novo usuário</h3>
        <form action={criarUsuario} className="space-y-3">
          <label className="block text-sm">
            <span className="block font-medium text-slate-700 mb-1">Nome</span>
            <input name="nome" required className="input" />
          </label>
          <label className="block text-sm">
            <span className="block font-medium text-slate-700 mb-1">CPF</span>
            <CpfInput required />
          </label>
          <label className="block text-sm">
            <span className="block font-medium text-slate-700 mb-1">Senha</span>
            <input name="senha" type="password" required minLength={6} className="input" />
          </label>
          <label className="block text-sm">
            <span className="block font-medium text-slate-700 mb-1">Perfil</span>
            <select name="role" defaultValue="VISUALIZADOR" className="input">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2">
            Criar usuário
          </button>
        </form>
      </div>
    </div>
  );
}
