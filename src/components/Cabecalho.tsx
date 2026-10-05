"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import { ROLE_LABELS, Role } from "@/lib/constants";

const NAV = [
  { href: "/dashboard", label: "Painel" },
  { href: "/veiculos", label: "Veículos" },
  { href: "/motoristas", label: "Motoristas" },
  { href: "/faturamento", label: "Faturamento" },
  { href: "/multas", label: "Multas de Trânsito" },
  // IPVA / Licenciamento: oculto do menu a pedido, rota continua ativa em /impostos
  { href: "/relatorios", label: "Relatórios" },
];

export default function Cabecalho({
  user,
  nomeSistema,
  subtitulo,
}: {
  user: { name: string; cpf: string; role: string };
  nomeSistema: string;
  subtitulo?: string | null;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const itens = user.role === "ADMIN" ? [...NAV, { href: "/configuracoes", label: "Configurações" }] : NAV;
  const ativo = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const classeItem = (href: string) =>
    `rounded-md px-3 py-1.5 text-sm transition ${
      ativo(href) ? "bg-slate-100 text-brand-600 font-medium" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/dashboard" className="shrink-0 leading-none">
          {subtitulo && (
            <span className="block text-[10px] uppercase tracking-[0.2em] text-brand-500">{subtitulo}</span>
          )}
          <span className="text-lg font-medium">{nomeSistema}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {itens.map((item) => (
            <Link key={item.href} href={item.href} className={classeItem(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm text-slate-600">{user.name}</span>
            <span className="block text-xs text-slate-500">{ROLE_LABELS[user.role as Role] ?? user.role}</span>
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sair"
            title="Sair"
            className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={18} />
          </button>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            {aberto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {aberto && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2 lg:hidden" aria-label="Principal">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {itens.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setAberto(false)} className={classeItem(item.href)}>
                {item.label}
              </Link>
            ))}
            <p className="px-3 py-1.5 text-xs text-slate-500 sm:hidden">
              {user.name} · {ROLE_LABELS[user.role as Role] ?? user.role}
            </p>
          </div>
        </nav>
      )}
    </header>
  );
}
