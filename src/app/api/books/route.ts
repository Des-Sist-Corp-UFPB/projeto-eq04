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
    // pdfData nunca deve voltar em listagens: são os bytes do arquivo
    // inteiro de cada livro, deixaria a resposta enorme sem necessidade.
    omit: { pdfData: true },
    include: { author: true, categories: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(books);
}

const createBookFieldsSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  coverUrl: z.string().url().optional(),
  authorName: z.string().min(1, "Informe o nome do autor."),
  categoryIds: z.array(z.string()).default([]),
});

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
// Assinatura binária ("magic bytes") que todo PDF válido começa com.
const PDF_MAGIC_BYTES = Buffer.from("%PDF-", "ascii");

/**
 * Valida um arquivo enviado como e-book do livro.
 *
 * Importante: NÃO confiamos apenas em `file.type` (o navegador deriva esse
 * valor da extensão do arquivo, então renomear "virus.exe" para
 * "virus.pdf" já engana essa checagem sozinha). Por isso também lemos os
 * primeiros bytes do arquivo e conferimos a assinatura real de um PDF.
 */
async function validatePdfFile(
  file: File
): Promise<{ buffer: Buffer } | { error: string }> {
  if (file.type !== "application/pdf") {
    return {
      error: `Tipo de arquivo inválido (${file.type || "desconhecido"}). Envie um arquivo PDF.`,
    };
  }

  if (file.size === 0) {
    return { error: "O arquivo enviado está vazio." };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      error: `O arquivo excede o tamanho máximo permitido (${MAX_PDF_SIZE_BYTES / (1024 * 1024)}MB).`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const header = buffer.subarray(0, PDF_MAGIC_BYTES.length);

  if (!header.equals(PDF_MAGIC_BYTES)) {
    return { error: "O conteúdo do arquivo não corresponde a um PDF válido." };
  }

  return { buffer };
}

// POST /api/books -> apenas ADMIN. multipart/form-data para permitir anexar
// o PDF do e-book junto com os dados do livro.
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const formData = await request.formData();

  const parsed = createBookFieldsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    coverUrl: formData.get("coverUrl") || undefined,
    authorName: formData.get("authorName"),
    categoryIds: formData.getAll("categoryIds").map(String),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // O PDF é opcional no cadastro (pode ser anexado depois via edição), mas
  // se um arquivo foi enviado, ele precisa ser um PDF válido.
  const pdfFile = formData.get("pdf");
  let pdfData: Buffer | undefined;
  let pdfFileName: string | undefined;

  if (pdfFile instanceof File && pdfFile.size > 0) {
    const result = await validatePdfFile(pdfFile);
    if ("error" in result) {
      return NextResponse.json(
        { error: { pdf: [result.error] } },
        { status: 400 }
      );
    }
    pdfData = result.buffer;
    pdfFileName = pdfFile.name;
  }

  const { categoryIds, authorName, ...data } = parsed.data;

  // Busca o autor pelo nome (ignorando maiúsculas/minúsculas e espaços nas
  // pontas) para não criar duplicatas como "George Orwell" e "george orwell"
  // só porque o admin digitou de um jeito diferente da vez anterior. Se não
  // existir, cria um novo — é assim que o campo de texto livre substitui o
  // antigo <select> que só deixava escolher autores já cadastrados.
  const trimmedAuthorName = authorName.trim();
  let author = await prisma.author.findFirst({
    where: { name: { equals: trimmedAuthorName, mode: "insensitive" } },
  });

  if (!author) {
    author = await prisma.author.create({ data: { name: trimmedAuthorName } });
    await logAudit({
      action: "AUTHOR_CREATE",
      userId: session.user.id,
      entity: "Author",
      entityId: author.id,
      metadata: { name: author.name, viaBookCreate: true },
      ipAddress: getClientIp(request),
    });
  }

  const book = await prisma.book.create({
    data: {
      ...data,
      authorId: author.id,
      pdfData,
      pdfFileName,
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
    omit: { pdfData: true },
  });

  await logAudit({
    action: "BOOK_CREATE",
    userId: session.user.id,
    entity: "Book",
    entityId: book.id,
    metadata: { title: book.title, hasPdf: Boolean(pdfData) },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(book, { status: 201 });
}