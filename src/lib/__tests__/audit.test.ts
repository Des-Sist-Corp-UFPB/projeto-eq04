import { logAudit, getClientIp } from "@/lib/audit";
import { prismaMock } from "@/__tests__/mocks/prisma";

describe("logAudit", () => {
  it("persiste evento de auditoria no banco", async () => {
    prismaMock.auditLog.create.mockResolvedValue({
      id: "log-1",
      action: "BOOK_CREATE",
      userId: "admin-1",
      entity: "Book",
      entityId: "book-1",
      metadata: { title: "Teste" },
      ipAddress: "127.0.0.1",
      createdAt: new Date(),
    } as any);

    await logAudit({
      action: "BOOK_CREATE",
      userId: "admin-1",
      entity: "Book",
      entityId: "book-1",
      metadata: { title: "Teste" },
      ipAddress: "127.0.0.1",
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "BOOK_CREATE",
        userId: "admin-1",
        entity: "Book",
        entityId: "book-1",
        metadata: { title: "Teste" },
        ipAddress: "127.0.0.1",
      },
    });
  });

  it("não propaga erro quando o banco falha", async () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error("DB offline"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await expect(
      logAudit({ action: "LOGIN_SUCCESS", userId: "user-1" })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("getClientIp", () => {
  it("extrai IP de x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.1");
  });

  it("usa x-real-ip como fallback", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "192.168.1.1" },
    });

    expect(getClientIp(request)).toBe("192.168.1.1");
  });

  it("retorna null se não houver headers de IP", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBeNull();
  });
});

describe("logAudit - default params", () => {
  it("salva log sem userId", async () => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    await logAudit({ action: "LOGIN_FAILED" });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "LOGIN_FAILED",
        userId: undefined,
        entity: undefined,
        entityId: undefined,
        metadata: undefined,
        ipAddress: undefined,
      },
    });
  });
});
