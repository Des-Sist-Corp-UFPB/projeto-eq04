import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Rota temporária para criar o admin inicial em produção.
// DELETAR após o primeiro uso!
export async function POST() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@dscebooks.com" },
  });

  if (existing) {
    return NextResponse.json({ error: "Admin já existe" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@dscebooks.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  return NextResponse.json({ ok: true, id: admin.id });
}