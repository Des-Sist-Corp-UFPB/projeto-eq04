import { POST } from "@/app/api/orders/route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockUserSession } from "@/__tests__/mocks/auth";

describe("POST /api/orders", () => {
  beforeEach(() => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);
    prismaMock.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === "function") {
        return callback(prismaMock);
      }
      return callback;
    });
    prismaMock.order.create.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      total: "29.90",
      status: "PAID",
    } as any);
    prismaMock.libraryItem.createMany.mockResolvedValue({ count: 1 });
  });

  it("retorna 401 para usuário não autenticado", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ bookIds: ["book-1"] }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("cria pedido e adiciona livros à biblioteca", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    prismaMock.book.findMany.mockResolvedValue([
      { id: "book-1", price: "29.90" },
    ] as any);

    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ bookIds: ["book-1"] }),
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "ORDER_CREATE" }),
      })
    );
  });

  it("retorna 404 quando livros não existem", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    prismaMock.book.findMany.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ bookIds: ["inexistente"] }),
      })
    );

    expect(response.status).toBe(404);
  });
});
