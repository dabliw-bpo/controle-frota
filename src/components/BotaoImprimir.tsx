"use client";

import { Printer } from "lucide-react";

export default function BotaoImprimir({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg px-4 py-2.5"
    >
      <Printer size={16} strokeWidth={2} />
      {label}
    </button>
  );
}
