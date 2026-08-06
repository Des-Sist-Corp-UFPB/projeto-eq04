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
  const validFields = {
    title: "Novo Livro",
    price: "39.9",
    authorName: "Isaac Asimov",
    categoryIds: ["cat-1"],
  };

  function buildFormData(overrides: Partial<typeof validFields> = {}, pdf?: File) {
    const fields = { ...validFields, ...overrides };
    const formData = new FormData();
    formData.set("title", fields.title);
    formData.set("price", fields.price);
    formData.set("authorName", fields.authorName);
    fields.categoryIds.forEach((id) => formData.append("categoryIds", id));
    if (pdf) formData.set("pdf", pdf);
    return formData;
  }

  function pdfFile(content = "%PDF-1.4\n...conteúdo...", name = "livro.pdf") {
    return new File([content], name, { type: "application/pdf" });
  }

  beforeEach(() => {
    prismaMock.book.create.mockClear();
    prismaMock.author.findFirst.mockReset();
    prismaMock.author.create.mockReset();
    // Por padrão, simula que o autor já existe (fluxo mais comum) — os
    // testes que precisam simular "autor novo" sobrescrevem isso.
    prismaMock.author.findFirst.mockResolvedValue({
      id: "author-1",
      name: validFields.authorName,
    } as any);
    prismaMock.book.create.mockResolvedValue({
      id: "new-book",
      title: validFields.title,
      price: "39.90",
      authorId: "author-1",
      description: null,
      coverUrl: null,
      pdfFileName: null,
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
        body: buildFormData(),
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
        body: buildFormData({ title: "", price: "-1", authorName: "" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("cria livro e registra auditoria para admin, sem PDF", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: buildFormData(),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Novo Livro");
    expect(data.pdfData).toBeUndefined();
    expect(prismaMock.book.create).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "BOOK_CREATE" }),
      })
    );
  });

  it("reaproveita autor existente (case-insensitive) em vez de duplicar", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());
    prismaMock.author.findFirst.mockResolvedValue({
      id: "author-1",
      name: "Isaac Asimov",
    } as any);

    await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: buildFormData({ authorName: "isaac asimov" }),
      })
    );

    expect(prismaMock.author.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { equals: "isaac asimov", mode: "insensitive" } },
      })
    );
    expect(prismaMock.author.create).not.toHaveBeenCalled();
    expect(prismaMock.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: "author-1" }),
      })
    );
  });

  it("cria um autor novo quando o nome digitado não existe ainda", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());
    prismaMock.author.findFirst.mockResolvedValue(null);
    prismaMock.author.create.mockResolvedValue({
      id: "author-novo",
      name: "Autor Inédito",
    } as any);

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: buildFormData({ authorName: "Autor Inédito" }),
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.author.create).toHaveBeenCalledWith({
      data: { name: "Autor Inédito" },
    });
    expect(prismaMock.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: "author-novo" }),
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "AUTHOR_CREATE" }),
      })
    );
  });

  it("cria livro com PDF válido anexado", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: buildFormData({}, pdfFile()),
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.book.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pdfFileName: "livro.pdf",
          pdfData: expect.any(Buffer),
        }),
      })
    );
  });

  it("rejeita arquivo com Content-Type diferente de application/pdf", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const fakeFile = new File(["não é um pdf"], "arquivo.txt", {
      type: "text/plain",
    });

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: buildFormData({}, fakeFile),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.pdf[0]).toMatch(/PDF/i);
    expect(prismaMock.book.create).not.toHaveBeenCalled();
  });

  it("rejeita arquivo renomeado para .pdf mas com conteúdo diferente (magic bytes)", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    // Content-Type forjado como application/pdf, mas o conteúdo real não
    // começa com a assinatura "%PDF-" — simula um arquivo malicioso
    // renomeado para burlar a checagem de extensão/tipo do navegador.
    const fakeFile = new File(["MZ\x90\x00 conteúdo binário qualquer"], "malicioso.pdf", {
      type: "application/pdf",
    });

    const response = await POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        body: buildFormData({}, fakeFile),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.pdf[0]).toMatch(/PDF válido/i);
    expect(prismaMock.book.create).not.toHaveBeenCalled();
  });
});