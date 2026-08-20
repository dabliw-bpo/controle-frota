"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Truck,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ROLE_LABELS, Role } from "@/lib/constants";
import { formatCpf } from "@/lib/cpf";

const NAV = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/veiculos", label: "Veículos", icon: Truck },
  { href: "/motoristas", label: "Motoristas", icon: Users },
  { href: "/faturamento", label: "Faturamento", icon: Wallet },
  // IPVA / Licenciamento: oculto do menu a pedido, rota continua ativa em /impostos
  { href: "/relatorios", label: "Relatórios", icon: FileText },
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
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Barra superior mobile */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-slate-900 text-white shrink-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2 rounded-lg hover:bg-slate-800 active:bg-slate-800"
        >
          <Menu size={22} />
        </button>
        <p className="font-semibold text-sm truncate">{nomeSistema}</p>
        <div className="w-9" aria-hidden />
      </header>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed md:sticky top-0 z-50 md:z-auto h-screen w-72 md:w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 py-6 border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">{nomeSistema}</p>
            {subtitulo && <p className="text-slate-400 text-xs mt-0.5 truncate">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-800">
          {user.role === "ADMIN" && (
            <Link
              href="/configuracoes"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname?.startsWith("/configuracoes")
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings size={18} strokeWidth={2} className="shrink-0" />
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
            className="mt-3 flex items-center gap-2 w-full text-left text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
