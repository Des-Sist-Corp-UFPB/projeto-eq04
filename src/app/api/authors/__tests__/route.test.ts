import { GET, POST } from "@/app/api/authors/route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockAdminSession, mockUserSession } from "@/__tests__/mocks/auth";

describe("GET /api/authors", () => {
  it("lista autores", async () => {
    prismaMock.author.findMany.mockResolvedValue([
      { id: "a1", name: "Isaac Asimov", bio: null, createdAt: new Date() },
    ] as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].name).toBe("Isaac Asimov");
  });
});

describe("POST /api/authors", () => {
  beforeEach(() => {
    prismaMock.author.create.mockResolvedValue({
      id: "a-new",
      name: "Novo Autor",
      bio: null,
      createdAt: new Date(),
    } as any);
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("cria autor como admin", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());

    const response = await POST(
      new Request("http://localhost/api/authors", {
        method: "POST",
        body: JSON.stringify({ name: "Novo Autor" }),
      })
    );

    expect(response.status).toBe(201);
    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });

  it("nega criação para usuário comum", async () => {
    mockAuth.mockResolvedValue(mockUserSession());

    const response = await POST(
      new Request("http://localhost/api/authors", {
        method: "POST",
        body: JSON.stringify({ name: "Hack" }),
      })
    );

    expect(response.status).toBe(403);
  });
});
