import bcrypt from "bcryptjs";
import { prismaMock } from "@/__tests__/mocks/prisma";

// Testa a lógica de authorize do NextAuth isoladamente
describe("Autenticação (Credentials provider)", () => {
  const authorize = async (credentials: {
    email?: string;
    password?: string;
  }) => {
    const email = credentials?.email;
    const password = credentials?.password;

    if (!email || !password) return null;

    const user = await prismaMock.user.findUnique({ where: { email } });

    if (!user) {
      await prismaMock.auditLog.create({
        data: {
          action: "LOGIN_FAILED",
          entity: "User",
          metadata: { email, reason: "user_not_found" },
        },
      });
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      await prismaMock.auditLog.create({
        data: {
          action: "LOGIN_FAILED",
          userId: user.id,
          entity: "User",
          metadata: { email, reason: "wrong_password" },
        },
      });
      return null;
    }

    await prismaMock.auditLog.create({
      data: {
        action: "LOGIN_SUCCESS",
        userId: user.id,
        entity: "User",
        entityId: user.id,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  };

  beforeEach(() => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("autentica usuário com credenciais válidas", async () => {
    const hash = await bcrypt.hash("senha123", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Demo",
      email: "demo@test.com",
      passwordHash: hash,
      role: "USER",
    } as any);

    const result = await authorize({
      email: "demo@test.com",
      password: "senha123",
    });

    expect(result).toEqual({
      id: "user-1",
      name: "Demo",
      email: "demo@test.com",
      role: "USER",
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "LOGIN_SUCCESS" }),
      })
    );
  });

  it("rejeita senha incorreta e registra LOGIN_FAILED", async () => {
    const hash = await bcrypt.hash("senha123", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Demo",
      email: "demo@test.com",
      passwordHash: hash,
      role: "USER",
    } as any);

    const result = await authorize({
      email: "demo@test.com",
      password: "errada",
    });

    expect(result).toBeNull();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "LOGIN_FAILED",
          metadata: { email: "demo@test.com", reason: "wrong_password" },
        }),
      })
    );
  });

  it("rejeita usuário inexistente", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await authorize({
      email: "naoexiste@test.com",
      password: "senha123",
    });

    expect(result).toBeNull();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "LOGIN_FAILED" }),
      })
    );
  });
});
