import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getConfiguracao } from "@/lib/settings";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const config = await getConfiguracao();

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar user={user} nomeSistema={config.nomeSistema} subtitulo={config.subtitulo} />
      <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
