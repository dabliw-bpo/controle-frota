import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/cpf";
import RelatorioAcoes from "@/components/RelatorioAcoes";

export default async function RelatorioMotoristasPage() {
  const motoristas = await prisma.motorista.findMany({
    include: { veiculo: true },
    orderBy: { nome: "asc" },
  });

  const pdfRows = motoristas.map((m) => [
    m.nome,
    m.cpf ? formatCpf(m.cpf) : "—",
    m.cargo || "—",
    m.cadastro || "—",
    m.admissao || "—",
    m.whatsapp || "—",
    m.email || "—",
    m.veiculo?.placa || "—",
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/relatorios" className="no-print text-sm text-brand-600 hover:underline">
            ← Voltar para Relatórios
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Relatório de Motoristas</h1>
          <p className="text-slate-500 text-sm mt-1">{motoristas.length} motorista(s)</p>
        </div>
        <RelatorioAcoes
          exportHref="/relatorios/motoristas/export"
          pdf={{
            title: "Relatório de Motoristas",
            subtitle: `${motoristas.length} motorista(s)`,
            filename: "motoristas.pdf",
            headers: ["Nome", "CPF", "Cargo", "Tipo", "Admissão", "WhatsApp", "E-mail", "Placa"],
            rows: pdfRows,
          }}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Admissão</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Placa</th>
            </tr>
          </thead>
          <tbody>
            {motoristas.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-medium whitespace-nowrap">{m.nome}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.cpf ? formatCpf(m.cpf) : "—"}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.cargo || "—"}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.cadastro || "—"}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.admissao || "—"}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.whatsapp || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{m.email || "—"}</td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{m.veiculo?.placa || "—"}</td>
              </tr>
            ))}
            {motoristas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Nenhum motorista cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
