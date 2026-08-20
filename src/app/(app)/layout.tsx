import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getConfiguracao } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { termosAceitosEm: true },
  });
  if (!usuario?.termosAceitosEm) redirect("/termos");

  const config = await getConfiguracao();

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      <Sidebar user={user} nomeSistema={config.nomeSistema} subtitulo={config.subtitulo} />
      <main className="flex-1 min-w-0 min-h-0 bg-slate-50 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 py-6 md:px-6 md:py-8 xl:px-10">{children}</div>
      </main>
    </div>
  );
}
