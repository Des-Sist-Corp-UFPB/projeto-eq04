import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

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

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
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

    return created;
  });

  await logAudit({
    action: "ORDER_CREATE",
    userId,
    entity: "Order",
    entityId: order.id,
    metadata: { bookIds: parsed.data.bookIds, total },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(order, { status: 201 });
}
