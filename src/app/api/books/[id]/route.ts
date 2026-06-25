import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: { author: true, categories: true },
  });

  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
  }

  return NextResponse.json(book);
}

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  coverUrl: z.string().url().optional(),
  authorId: z.string().min(1).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { categoryIds, ...data } = parsed.data;

  const book = await prisma.book.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(categoryIds
        ? { categories: { set: categoryIds.map((id) => ({ id })) } }
        : {}),
    },
  });

  await logAudit({
    action: "BOOK_UPDATE",
    userId: session.user.id,
    entity: "Book",
    entityId: book.id,
    metadata: { changedFields: Object.keys(parsed.data) },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(book);
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const book = await prisma.book.delete({ where: { id: params.id } });

  await logAudit({
    action: "BOOK_DELETE",
    userId: session.user.id,
    entity: "Book",
    entityId: book.id,
    metadata: { title: book.title },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
