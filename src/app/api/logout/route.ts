import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logAudit, getClientIp } from "@/lib/audit";

// Chamada pelo cliente logo antes de signOut(), para registrar o evento
// enquanto a sessão ainda é válida.
export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.id) {
    await logAudit({
      action: "LOGOUT",
      userId: session.user.id,
      entity: "User",
      entityId: session.user.id,
      ipAddress: getClientIp(request),
    });
  }

  return NextResponse.json({ ok: true });
}
