import { GET } from "@/app/api/admin/audit-logs/route";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockAdminSession, mockUserSession } from "@/__tests__/mocks/auth";

describe("GET /api/admin/audit-logs", () => {
  it("retorna logs para admin", async () => {
    mockAuth.mockResolvedValue(mockAdminSession());
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: "log-1",
        action: "BOOK_CREATE",
        userId: "admin-1",
        entity: "Book",
        entityId: "book-1",
        metadata: null,
        ipAddress: null,
        createdAt: new Date(),
        user: { name: "Admin", email: "admin@test.com" },
      },
    ] as any);

    const response = await GET(
      new Request("http://localhost/api/admin/audit-logs?action=BOOK_CREATE")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].action).toBe("BOOK_CREATE");
  });

  it("retorna 403 para usuário comum", async () => {
    mockAuth.mockResolvedValue(mockUserSession());

    const response = await GET(
      new Request("http://localhost/api/admin/audit-logs")
    );

    expect(response.status).toBe(403);
  });
});
