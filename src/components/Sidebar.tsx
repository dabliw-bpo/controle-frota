"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ROLE_LABELS, Role } from "@/lib/constants";
import { formatCpf } from "@/lib/cpf";

const NAV = [
  { href: "/dashboard", label: "Painel", icon: "📊" },
  { href: "/veiculos", label: "Veículos", icon: "🚚" },
  { href: "/motoristas", label: "Motoristas", icon: "🧑‍✈️" },
  { href: "/faturamento", label: "Faturamento", icon: "💰" },
  // IPVA / Licenciamento: oculto do menu a pedido, rota continua ativa em /impostos
  { href: "/relatorios", label: "Relatórios", icon: "📄" },
];

export default function Sidebar({
  user,
  nomeSistema,
  subtitulo,
}: {
  user: { name: string; cpf: string; role: string };
  nomeSistema: string;
  subtitulo?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-6 border-b border-slate-800">
        <p className="text-white font-bold text-lg leading-tight">{nomeSistema}</p>
        {subtitulo && <p className="text-slate-400 text-xs mt-0.5">{subtitulo}</p>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-800">
        {user.role === "ADMIN" && (
          <Link
            href="/configuracoes"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname?.startsWith("/configuracoes")
                ? "bg-brand-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>⚙️</span>
            Configurações
          </Link>
        )}
      </div>

      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-slate-400 truncate">{formatCpf(user.cpf)}</p>
        <p className="text-xs text-brand-400 mt-0.5">
          {ROLE_LABELS[user.role as Role] ?? user.role}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
