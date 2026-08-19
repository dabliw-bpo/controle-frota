import { getConfiguracao } from "@/lib/settings";
import LoginForm from "@/components/LoginForm";

// Evita pré-renderizar em build time (que exigiria acesso ao banco durante o
// build); a config é sempre buscada em tempo de requisição.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const config = await getConfiguracao();
  return <LoginForm nomeSistema={config.nomeSistema} subtitulo={config.subtitulo} />;
}
