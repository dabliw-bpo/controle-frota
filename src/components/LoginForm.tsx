"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCpf } from "@/lib/cpf";

function LoginFormInner({ nomeSistema, subtitulo }: { nomeSistema: string; subtitulo?: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const res = await signIn("credentials", {
      cpf,
      senha,
      redirect: false,
    });

    setCarregando(false);

    if (res?.error) {
      setErro("CPF ou senha inválidos.");
      return;
    }

    router.push(params.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="mt-1 text-2xl font-medium text-slate-900 sm:text-3xl">{nomeSistema}</h1>
          {subtitulo && <p className="text-sm text-slate-500 mt-1">{subtitulo}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CPF
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="username"
              required
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginForm({ nomeSistema, subtitulo }: { nomeSistema: string; subtitulo?: string | null }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner nomeSistema={nomeSistema} subtitulo={subtitulo} />
    </Suspense>
  );
}
