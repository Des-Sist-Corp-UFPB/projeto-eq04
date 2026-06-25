import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

// GET /api/admin/audit-logs?action=&userId=&take=
export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") as AuditAction | null;
  const userId = searchParams.get("userId") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 50), 200);

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(logs);
}
