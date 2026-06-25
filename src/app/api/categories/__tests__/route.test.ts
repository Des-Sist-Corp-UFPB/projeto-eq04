import { GET, POST } from "../route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockAdminSession, mockUserSession } from "@/__tests__/mocks/auth";

describe("GET /api/categories", () => {
  it("retorna lista de categorias ordenada por nome", async () => {
    prismaMock.category.findMany.mockResolvedValue([
      { id: "c1", name: "Aventura", createdAt: new Date() },
      { id: "c2", name: "Drama", createdAt: new Date() },
    ] as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].name).toBe("Aventura");
    expect(data[1].name).toBe("Drama");
    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
  });
});

describe("POST /api/categories", () => {
  const validBody = { name: "Nova Categoria" };

  beforeEach(() => {
    prismaMock.category.create.mockResolvedValue({
      id: "cat-new",
      name: "Nova Categoria",
      createdAt: new Date(),
    } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("retorna 403 se usuário não estiver autenticado", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/categories", {
        method: "POST",
        body: JSON.stringify(validBody),
      })
    );

    expect(response.status).toBe(403);
  });

  it("retorna 403 se usuário comum tentar cadastrar", async () => {
    mockAuth.mockResolvedValue(mockUserSession());

    const response = await POST(
      new Request("http://localhost/api/categories", {
        method: "POST",
        body: JSON.stringify(validBody),
      })
    );

    expect(response.status).toBe(403);
  });

  it("retorna 400 para payload inválido (nome vazio)", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("cria categoria e registra log de auditoria se admin", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/categories", {
        method: "POST",
        body: JSON.stringify(validBody),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("cat-new");
    expect(data.name).toBe("Nova Categoria");
    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: { name: "Nova Categoria" },
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CATEGORY_CREATE",
          userId: "admin-1",
          entityId: "cat-new",
        }),
      })
    );
  });
});
