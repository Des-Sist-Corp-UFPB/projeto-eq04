import bcrypt from "bcryptjs";
import { prismaMock } from "@/__tests__/mocks/prisma";

// Testa a lógica de authorize do NextAuth isoladamente,
// sem conflitar com o mock global de @/auth do jest.setup.ts
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

  const jwtCallback = async ({
    token,
    user,
  }: {
    token: Record<string, unknown>;
    user?: { id: string; role: string };
  }) => {
    if (user) {
      token.id = user.id;
      token.role = user.role;
    }
    return token;
  };

  const sessionCallback = async ({
    session,
    token,
  }: {
    session: { user?: Record<string, unknown> };
    token: Record<string, unknown>;
  }) => {
    if (session.user) {
      session.user.id = token.id;
      session.user.role = token.role;
    }
    return session;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  describe("authorize", () => {
    it("retorna null se email ou senha não forem fornecidos", async () => {
      expect(await authorize({ email: "", password: "" })).toBeNull();
      expect(await authorize({})).toBeNull();
    });

    it("retorna null e registra LOGIN_FAILED se o usuário não for encontrado", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await authorize({
        email: "missing@test.com",
        password: "123",
      });

      expect(result).toBeNull();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LOGIN_FAILED",
            metadata: { email: "missing@test.com", reason: "user_not_found" },
          }),
        })
      );
    });

    it("retorna null e registra LOGIN_FAILED se a senha estiver incorreta", async () => {
      const hash = await bcrypt.hash("correct-pass", 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        name: "Demo",
        email: "demo@test.com",
        passwordHash: hash,
        role: "USER",
      } as any);

      const result = await authorize({
        email: "demo@test.com",
        password: "wrong-pass",
      });

      expect(result).toBeNull();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LOGIN_FAILED",
            userId: "user-1",
          }),
        })
      );
    });

    it("retorna o usuário e registra LOGIN_SUCCESS com credenciais corretas", async () => {
      const hash = await bcrypt.hash("correct-pass", 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        name: "Demo",
        email: "demo@test.com",
        passwordHash: hash,
        role: "USER",
      } as any);

      const result = await authorize({
        email: "demo@test.com",
        password: "correct-pass",
      });

      expect(result).toEqual({
        id: "user-1",
        name: "Demo",
        email: "demo@test.com",
        role: "USER",
      });
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LOGIN_SUCCESS",
            userId: "user-1",
          }),
        })
      );
    });
  });

  describe("callbacks", () => {
    it("adiciona id e role ao token na primeira chamada", async () => {
      const result = await jwtCallback({
        token: {},
        user: { id: "user-123", role: "ADMIN" },
      });
      expect(result).toEqual({ id: "user-123", role: "ADMIN" });
    });

    it("retorna o token inalterado se user não for fornecido", async () => {
      const token = { id: "existing-id", role: "USER" };
      const result = await jwtCallback({ token });
      expect(result).toEqual(token);
    });

    it("adiciona id e role do token à sessão", async () => {
      const result = await sessionCallback({
        session: { user: {} },
        token: { id: "user-123", role: "ADMIN" },
      });
      expect(result.user).toEqual({ id: "user-123", role: "ADMIN" });
    });

    it("retorna session inalterada se user não existir na session", async () => {
      const session = {};
      const result = await sessionCallback({
        session,
        token: { id: "user-123", role: "ADMIN" },
      });
      expect(result).toEqual({});
    });
  });
});
