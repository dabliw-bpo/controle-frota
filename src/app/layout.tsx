import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { getConfiguracao } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  // Nunca deixa uma falha de conexão (ex: durante o build) quebrar a metadata.
  const nomeSistema = await getConfiguracao()
    .then((c) => c.nomeSistema)
    .catch(() => "Controle de Frota");
  return {
    title: nomeSistema,
    description: "Sistema de gestão de frota",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
