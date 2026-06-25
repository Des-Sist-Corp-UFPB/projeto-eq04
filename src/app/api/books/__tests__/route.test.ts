import { GET, POST } from "@/app/api/books/route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockAdminSession, mockUserSession } from "@/__tests__/mocks/auth";
import { mockBooks } from "@/__tests__/setup/mock-data";

describe("GET /api/books", () => {
  beforeEach(() => {
    prismaMock.book.findMany.mockResolvedValue(mockBooks as any);
  });

  it("retorna lista de livros sem filtros", async () => {
    const response = await GET(new Request("http://localhost/api/books"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Fundação");
    expect(prismaMock.book.findMany).toHaveBeenCalled();
  });

  it("aplica filtro de busca por título ou autor", async () => {
    await GET(new Request("http://localhost/api/books?q=asimov"));

    expect(prismaMock.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { title: { contains: "asimov", mode: "insensitive" } },
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it("aplica filtro de busca por categoria", async () => {
    await GET(new Request("http://localhost/api/books?categoryId=cat-1"));

    expect(prismaMock.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { categories: { some: { id: "cat-1" } } },
          ]),
        }),
      })
    );
  });
});

describe("POST /api/books", () => {
  const validBody = {
    title: "Novo Livro",
    price: 39.9,
    authorId: "author-1",
    categoryIds: ["cat-1"],
  };

  beforeEach(() => {
    prismaMock.book.create.mockResolvedValue({
      id: "new-book",
      ...validBody,
      price: "39.90",
      description: null,
      coverUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("retorna 403 quando usuário não é admin", async () => {
    mockAuth.mockResolvedValue(mockUserSession());

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: JSON.stringify(validBody),
      })
    );

    expect(response.status).toBe(403);
    expect(prismaMock.book.create).not.toHaveBeenCalled();
  });

  it("retorna 400 para payload inválido", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: JSON.stringify({ title: "", price: -1, authorId: "" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("cria livro e registra auditoria para admin", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Novo Livro");
    expect(prismaMock.book.create).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "BOOK_CREATE" }),
      })
    );
  });
});
