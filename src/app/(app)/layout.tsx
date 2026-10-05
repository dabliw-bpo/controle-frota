import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getConfiguracao } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import Cabecalho from "@/components/Cabecalho";

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
    <div className="min-h-screen">
      <Cabecalho user={user} nomeSistema={config.nomeSistema} subtitulo={config.subtitulo} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
