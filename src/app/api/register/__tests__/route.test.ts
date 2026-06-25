import { POST } from "@/app/api/register/route";
import { prismaMock } from "@/__tests__/mocks/prisma";

describe("POST /api/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-new",
      name: "Novo Usuário",
      email: "novo@test.com",
      passwordHash: "hash",
      role: "USER",
      interests: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("registra novo usuário com dados válidos", async () => {
    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Novo Usuário",
          email: "novo@test.com",
          password: "senha123",
        }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.email).toBe("novo@test.com");
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "USER_REGISTER" }),
      })
    );
  });

  it("retorna 400 para e-mail inválido", async () => {
    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Teste",
          email: "invalido",
          password: "senha123",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("retorna 409 quando e-mail já está cadastrado", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "existente@test.com",
    } as any);

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: "Teste",
          email: "existente@test.com",
          password: "senha123",
        }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("E-mail já cadastrado");
  });
});
