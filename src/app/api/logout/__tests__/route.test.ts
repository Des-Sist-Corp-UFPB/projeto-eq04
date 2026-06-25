import { POST } from "../route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockUserSession } from "@/__tests__/mocks/auth";

describe("POST /api/logout", () => {
  beforeEach(() => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("registra log de auditoria se usuário estiver autenticado e retorna ok", async () => {
    mockAuth.mockResolvedValue(mockUserSession());

    const response = await POST(new Request("http://localhost/api/logout", { method: "POST" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "LOGOUT",
          userId: "user-1",
        }),
      })
    );
  });

  it("apenas retorna ok se usuário não estiver autenticado", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/logout", { method: "POST" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});
