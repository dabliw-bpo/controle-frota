"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function aceitarTermos() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await prisma.usuario.update({
    where: { id: user.id },
    data: { termosAceitosEm: new Date() },
  });

  redirect("/dashboard");
}
