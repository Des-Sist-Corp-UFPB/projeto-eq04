import { GET, PUT, DELETE } from "@/app/api/books/[id]/route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockAdminSession, mockUserSession } from "@/__tests__/mocks/auth";
import { mockBooks } from "@/__tests__/setup/mock-data";

const params = { params: { id: "book-1" } };

describe("CRUD de livros via Prisma (mock)", () => {
  const book = mockBooks[0];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockReset();
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  describe("READ", () => {
    it("retorna livro existente", async () => {
      prismaMock.book.findUnique.mockResolvedValue(book as any);

      const response = await GET(
        new Request("http://localhost/api/books/book-1"),
        params
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Fundação");
    });

    it("retorna 404 para livro não encontrado", async () => {
      prismaMock.book.findUnique.mockResolvedValue(null);

      const response = await GET(
        new Request("http://localhost/api/books/inexistente"),
        { params: { id: "inexistente" } }
      );

      expect(response.status).toBe(404);
    });
  });

  describe("UPDATE", () => {
    it("atualiza livro como admin", async () => {
      mockAuth.mockResolvedValue(mockAdminSession());
      prismaMock.book.update.mockResolvedValue({
        ...book,
        title: "Fundação (edição revisada)",
      } as any);

      const response = await PUT(
        new Request("http://localhost/api/books/book-1", {
          method: "PUT",
          body: JSON.stringify({ title: "Fundação (edição revisada)" }),
        }),
        params
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toContain("revisada");
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "BOOK_UPDATE" }),
        })
      );
    });

    it("nega atualização para usuário comum", async () => {
      mockAuth.mockResolvedValue(mockUserSession());

      const response = await PUT(
        new Request("http://localhost/api/books/book-1", {
          method: "PUT",
          body: JSON.stringify({ title: "Hack" }),
        }),
        params
      );

      expect(response.status).toBe(403);
    });

    it("retorna 400 para payload de atualização inválido", async () => {
      mockAuth.mockResolvedValue(mockAdminSession());

      const response = await PUT(
        new Request("http://localhost/api/books/book-1", {
          method: "PUT",
          body: JSON.stringify({ title: "" }), // empty title is invalid
        }),
        params
      );

      expect(response.status).toBe(400);
    });

    it("atualiza livro com categorias como admin", async () => {
      mockAuth.mockResolvedValue(mockAdminSession());
      prismaMock.book.update.mockResolvedValue({
        ...book,
        title: "Novo",
      } as any);

      const response = await PUT(
        new Request("http://localhost/api/books/book-1", {
          method: "PUT",
          body: JSON.stringify({ title: "Novo", categoryIds: ["cat-1"] }),
        }),
        params
      );

      expect(response.status).toBe(200);
      expect(prismaMock.book.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: { set: [{ id: "cat-1" }] },
          }),
        })
      );
    });
  });

  describe("DELETE", () => {
    it("remove livro como admin", async () => {
      mockAuth.mockResolvedValue(mockAdminSession());
      prismaMock.book.delete.mockResolvedValue(book as any);

      const response = await DELETE(
        new Request("http://localhost/api/books/book-1"),
        params
      );

      expect(response.status).toBe(200);
      expect(prismaMock.book.delete).toHaveBeenCalledWith({
        where: { id: "book-1" },
      });
    });

    it("retorna 403 para usuário comum ao remover livro", async () => {
      mockAuth.mockResolvedValue(mockUserSession());

      const response = await DELETE(
        new Request("http://localhost/api/books/book-1"),
        params
      );

      expect(response.status).toBe(403);
      expect(prismaMock.book.delete).not.toHaveBeenCalled();
    });
  });
});
