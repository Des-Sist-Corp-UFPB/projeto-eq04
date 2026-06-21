import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

// GET /api/books?q=texto&categoryId=...  -> listagem com busca por título/autor/categoria
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const books = await prisma.book.findMany({
    where: {
      AND: [
        categoryId ? { categories: { some: { id: categoryId } } } : {},
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { author: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    include: { author: true, categories: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(books);
}

const createBookSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  coverUrl: z.string().url().optional(),
  authorId: z.string().min(1),
  categoryIds: z.array(z.string()).default([]),
});

// POST /api/books -> apenas ADMIN
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { categoryIds, ...data } = parsed.data;

  const book = await prisma.book.create({
    data: {
      ...data,
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
  });

  await logAudit({
    action: "BOOK_CREATE",
    userId: session.user.id,
    entity: "Book",
    entityId: book.id,
    metadata: { title: book.title },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(book, { status: 201 });
}
