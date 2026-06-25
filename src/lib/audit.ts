import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

interface LogAuditParams {
  action: AuditAction;
  userId?: string | null;
  entity?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

/**
 * Registra um evento no log de auditoria.
 *
 * Importante: nunca deve lançar erro para quem chamou — uma falha ao
 * gravar o log não pode derrubar a ação principal do usuário (ex: login,
 * criação de pedido). Em caso de erro, registramos no console do servidor.
 */
export async function logAudit({
  action,
  userId = null,
  entity,
  entityId,
  metadata,
  ipAddress = null,
}: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId ?? undefined,
        entity,
        entityId,
        metadata,
        ipAddress: ipAddress ?? undefined,
      },
    });
  } catch (error) {
    console.error("[audit] falha ao registrar log de auditoria:", error);
  }
}

/** Extrai o IP do cliente a partir dos headers de uma Request (considera proxy/Docker). */
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
