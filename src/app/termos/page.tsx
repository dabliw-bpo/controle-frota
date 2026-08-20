import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getConfiguracao } from "@/lib/settings";
import { aceitarTermos } from "./actions";

export const dynamic = "force-dynamic";

export default async function TermosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { termosAceitosEm: true },
  });
  if (usuario?.termosAceitosEm) redirect("/dashboard");

  const config = await getConfiguracao();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Termo de Uso e Política de Privacidade</h1>
          <p className="text-sm text-slate-500 mt-1">
            Leia com atenção antes de continuar. A confirmação é solicitada apenas uma vez.
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-5 text-sm text-slate-700 space-y-4 bg-slate-50">
          <section>
            <h2 className="font-semibold text-slate-900 mb-1">1. Termo de Uso</h2>
            <p>
              O {config.nomeSistema} é um sistema interno de controle de frota, destinado exclusivamente
              ao uso por colaboradores e prestadores autorizados. Ao acessar, você concorda em:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utilizar o sistema somente para fins relacionados às suas atividades de trabalho.</li>
              <li>
                Manter sua senha em sigilo e não compartilhar seu login com terceiros. Você é responsável
                por todas as ações realizadas com sua conta.
              </li>
              <li>
                Inserir informações verdadeiras e atualizadas nos cadastros de veículos, motoristas e
                faturamento.
              </li>
              <li>
                Não copiar, extrair ou divulgar dados do sistema (cadastros, valores, documentos) fora do
                contexto do seu trabalho, sem autorização.
              </li>
              <li>
                Comunicar imediatamente à administração qualquer uso indevido, acesso não autorizado ou
                suspeita de vazamento de dados.
              </li>
            </ul>
            <p className="mt-2">
              O acesso pode ser suspenso a qualquer momento em caso de descumprimento deste termo, desligamento
              ou por decisão da administração do sistema.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900 mb-1">2. Política de Privacidade</h2>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), esta política
              explica como os dados pessoais tratados no {config.nomeSistema} são utilizados.
            </p>
            <p className="mt-2 font-medium text-slate-800">Dados coletados</p>
            <p>
              Nome, CPF, telefone/WhatsApp e cargo (de usuários e motoristas cadastrados), além de dados
              operacionais e financeiros vinculados à frota (veículos, faturamento, comissões).
            </p>
            <p className="mt-2 font-medium text-slate-800">Finalidade</p>
            <p>
              Os dados são usados exclusivamente para gestão da frota: controle de veículos, vínculo com
              motoristas, apuração de faturamento e comissões, e emissão de relatórios internos.
            </p>
            <p className="mt-2 font-medium text-slate-800">Armazenamento e segurança</p>
            <p>
              Os dados ficam armazenados em banco de dados na nuvem, com acesso restrito por login e senha
              individuais, e são utilizados apenas por pessoas autorizadas para os fins descritos acima.
            </p>
            <p className="mt-2 font-medium text-slate-800">Compartilhamento</p>
            <p>
              Os dados não são vendidos ou compartilhados com terceiros para fins de marketing. Podem ser
              acessados por prestadores de tecnologia estritamente para viabilizar o funcionamento do sistema
              (hospedagem e banco de dados).
            </p>
            <p className="mt-2 font-medium text-slate-800">Seus direitos</p>
            <p>
              Você pode solicitar, a qualquer momento, acesso, correção ou exclusão dos seus dados pessoais
              junto à administração do sistema, respeitadas as obrigações legais e contratuais de retenção
              de registros.
            </p>
          </section>
        </div>

        <form action={aceitarTermos} className="mt-6 space-y-4">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="aceite"
              required
              className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Li e aceito o Termo de Uso e a Política de Privacidade descritos acima.
          </label>
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
