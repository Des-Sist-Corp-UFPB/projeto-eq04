import { NextResponse } from "next/server";
import { z } from "zod";
import { trace } from "@opentelemetry/api";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

const tracer = trace.getTracer("app");

// O gateway de pagamento real entra na Fase 6 do roadmap. Por enquanto,
// o pedido é confirmado imediatamente (status "PAID") para permitir testar
// o fluxo de compra -> biblioteca -> recomendações ponta a ponta.
const createOrderSchema = z.object({
  bookIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const books = await prisma.book.findMany({
    where: { id: { in: parsed.data.bookIds } },
  });

  if (books.length === 0) {
    return NextResponse.json({ error: "Livros não encontrados" }, { status: 404 });
  }

  const total = books.reduce((sum, book) => sum + Number(book.price), 0);
  const userId = session.user.id;

  // Span manual: cobre a regra de negócio "finalizar pedido" (transação +
  // liberação na biblioteca digital + auditoria), não apenas a query SQL
  // isolada que a auto-instrumentação já captura.
  const order = await tracer.startActiveSpan("finalizar-pedido", async (span) => {
    span.setAttribute("pedido.usuario_id", userId);
    span.setAttribute("pedido.quantidade_itens", books.length);
    span.setAttribute("pedido.valor", total);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            userId,
            total,
            items: {
              create: books.map((book) => ({
                bookId: book.id,
                price: book.price,
              })),
            },
          },
        });

        await tx.libraryItem.createMany({
          data: books.map((book) => ({ userId, bookId: book.id })),
          skipDuplicates: true,
        });

        return createdOrder;
      });

      span.setAttribute("pedido.id", created.id);

      await logAudit({
        action: "ORDER_CREATE",
        userId,
        entity: "Order",
        entityId: created.id,
        metadata: { bookIds: parsed.data.bookIds, total },
        ipAddress: getClientIp(request),
      });

      return created;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });

  return NextResponse.json(order, { status: 201 });
}
