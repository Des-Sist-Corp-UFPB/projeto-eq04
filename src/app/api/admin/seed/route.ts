import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function POST() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    await prisma.recommendation.deleteMany();
    await prisma.libraryItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.book.deleteMany();
    await prisma.author.deleteMany();
    await prisma.category.deleteMany();
    await prisma.auditLog.deleteMany();

    const categoryNames = [
      "Ficção científica", "Fantasia", "Romance",
      "Tecnologia", "Negócios", "Autoajuda", "História",
    ];
    const categories = await Promise.all(
      categoryNames.map((name) => prisma.category.create({ data: { name } }))
    );
    const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]));

    const authorNames = [
      "Isaac Asimov", "Ursula K. Le Guin", "Jane Austen",
      "Cal Newport", "Yuval Noah Harari", "Robert Martin",
    ];
    const authors = await Promise.all(
      authorNames.map((name) => prisma.author.create({ data: { name } }))
    );
    const authorByName = Object.fromEntries(authors.map((a) => [a.name, a]));

    const booksData = [
      { title: "Fundação", author: "Isaac Asimov", categories: ["Ficção científica"], price: 29.9, description: "Uma saga sobre o colapso e renascimento de um império galáctico." },
      { title: "Eu, Robô", author: "Isaac Asimov", categories: ["Ficção científica"], price: 24.9, description: "Contos clássicos sobre robótica e as Três Leis da Robótica." },
      { title: "A Mão Esquerda da Escuridão", author: "Ursula K. Le Guin", categories: ["Ficção científica", "Fantasia"], price: 32.5, description: "Um clássico da ficção científica sobre gênero e diplomacia interestelar." },
      { title: "Orgulho e Preconceito", author: "Jane Austen", categories: ["Romance"], price: 19.9, description: "O romance mais famoso de Jane Austen sobre amor e classe social." },
      { title: "Razão e Sensibilidade", author: "Jane Austen", categories: ["Romance"], price: 21.9, description: "A história das irmãs Dashwood e seus dilemas amorosos." },
      { title: "Trabalho Focado (Deep Work)", author: "Cal Newport", categories: ["Negócios", "Autoajuda"], price: 39.9, description: "Como produzir mais em um mundo cheio de distrações." },
      { title: "Sapiens: Uma Breve História da Humanidade", author: "Yuval Noah Harari", categories: ["História"], price: 44.9, description: "Uma visão abrangente da história da espécie humana." },
      { title: "Código Limpo", author: "Robert Martin", categories: ["Tecnologia"], price: 54.9, description: "Boas práticas para escrever código legível e sustentável." },
    ];

    const books = [];
    for (const data of booksData) {
      const book = await prisma.book.create({
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          authorId: authorByName[data.author].id,
          categories: {
            connect: data.categories.map((name) => ({ id: categoryByName[name].id })),
          },
        },
      });
      books.push(book);
    }

    const userPasswordHash = await bcrypt.hash("user123", 10);
    const demoUser = await prisma.user.upsert({
      where: { email: "demo@dscebooks.com" },
      update: { passwordHash: userPasswordHash },
      create: {
        name: "Usuário Demo",
        email: "demo@dscebooks.com",
        passwordHash: userPasswordHash,
        role: "USER",
        interests: "Gosto de ficção científica e livros sobre produtividade.",
        favoriteCategories: {
          connect: [
            { id: categoryByName["Ficção científica"].id },
            { id: categoryByName["Negócios"].id },
          ],
        },
      },
    });

    const fundacao = books.find((b) => b.title === "Fundação")!;
    const euRobo = books.find((b) => b.title === "Eu, Robô")!;

    await prisma.order.create({
      data: {
        userId: demoUser.id,
        total: Number(fundacao.price) + Number(euRobo.price),
        items: {
          create: [
            { bookId: fundacao.id, price: fundacao.price },
            { bookId: euRobo.id, price: euRobo.price },
          ],
        },
      },
    });

    await prisma.libraryItem.createMany({
      data: [
        { userId: demoUser.id, bookId: fundacao.id },
        { userId: demoUser.id, bookId: euRobo.id },
      ],
    });

    await logAudit({
      action: "USER_REGISTER",
      userId: session.user.id,
      entity: "Seed",
      metadata: {
        books: books.length,
        authors: authors.length,
        categories: categories.length,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Seed executado com sucesso!",
      data: {
        livros: books.length,
        autores: authors.length,
        categorias: categories.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[seed] erro:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}