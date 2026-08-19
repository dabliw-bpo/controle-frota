import { AuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { onlyDigits } from "@/lib/cpf";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        cpf: { label: "CPF", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.cpf || !credentials?.senha) return null;

        const cpf = onlyDigits(credentials.cpf);
        if (cpf.length !== 11) return null;

        const usuario = await prisma.usuario.findUnique({ where: { cpf } });
        if (!usuario || !usuario.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senhaHash);
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          cpf: usuario.cpf,
          role: usuario.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.cpf = (user as any).cpf;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).cpf = token.cpf;
      }
      return session;
    },
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user as
    | { id: string; name: string; cpf: string; role: string }
    | undefined;
}
