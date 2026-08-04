import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

// GET /api/books?q=texto&categoryId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const books = await prisma.book.findMany({
    where: {
      AND: [
        categoryId
          ? { categories: { some: { id: categoryId } } }
          : {},
        q
          ? {
              OR: [
                {
                  title: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  author: {
                    name: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {},
      ],
    },
    include: {
      author: true,
      categories: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(books);
}

const createBookSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  pdfUrl: z.string().url().optional(),
  authorId: z.string().min(1),
  categoryIds: z.array(z.string()).default([]),
});

// POST /api/books
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Recebe multipart/form-data
    const formData = await request.formData();

    const body = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
      pdfUrl: formData.get("pdfUrl") || undefined,
      authorId: formData.get("authorId"),
      categoryIds: JSON.parse(
        (formData.get("categoryIds") as string) || "[]"
      ),
    };

    const pdfFile = formData.get("pdf");

    console.log("PDF recebido:", pdfFile instanceof File ? pdfFile.name : "nenhum"
);

if (!(pdfFile instanceof File) || pdfFile.size === 0) {
  return NextResponse.json(
    {
      error: "O arquivo PDF do e-book é obrigatório",
    },
    {
      status: 400,
    }
  );
}

    console.log("Livro recebido:", body);
    console.log(
      "PDF recebido:",
      pdfFile instanceof File ? pdfFile.name : "nenhum"
    );

    const parsed = createBookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { categoryIds, ...data } = parsed.data;

    const book = await prisma.book.create({
      data: {
        ...data,
        categories: {
          connect: categoryIds.map((id) => ({
            id,
          })),
        },
      },
      include: {
        author: true,
        categories: true,
      },
    });

    await logAudit({
      action: "BOOK_CREATE",
      userId: session.user.id,
      entity: "Book",
      entityId: book.id,
      metadata: {
        title: book.title,
      },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(book, {
      status: 201,
    });

  } catch (error) {
    console.error("Erro ao criar livro:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao criar livro",
        details:
          error instanceof Error
            ? error.message
            : error,
      },
      {
        status: 500,
      }
    );
  }
}