import bcrypt from "bcryptjs";
import { prismaMock } from "@/__tests__/mocks/prisma";

let capturedOptions: any = null;

jest.mock("next-auth", () => {
  return jest.fn((options) => {
    capturedOptions = options;
    return {
      handlers: { GET: jest.fn(), POST: jest.fn() },
      signIn: jest.fn(),
      signOut: jest.fn(),
      auth: jest.fn(),
    };
  });
});

// Import the auth config to trigger NextAuth and populate capturedOptions
import { auth } from "../auth";

describe("Configuração do NextAuth (auth.ts)", () => {
  beforeEach(() => {
    prismaMock.auditLog.create.mockResolvedValue({} as any);
  });

  it("deve registrar o credentials provider e as callbacks corretas", () => {
    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions.session.strategy).toBe("jwt");
    expect(capturedOptions.pages.signIn).toBe("/login");
    expect(capturedOptions.providers).toHaveLength(1);
    expect(capturedOptions.callbacks.jwt).toBeDefined();
    expect(capturedOptions.callbacks.session).toBeDefined();
  });

  describe("Credentials Provider - authorize", () => {
    let authorizeFn: any;

    beforeAll(() => {
      authorizeFn = capturedOptions.providers[0].authorize;
    });

    it("retorna null se email ou senha não forem fornecidos", async () => {
      const res = await authorizeFn({ email: "", password: "" });
      expect(res).toBeNull();

      const res2 = await authorizeFn(null as any);
      expect(res2).toBeNull();
    });

    it("retorna null e registra LOGIN_FAILED se o usuário não for encontrado", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await authorizeFn({ email: "missing@test.com", password: "123" });
      expect(res).toBeNull();
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

      const res = await authorizeFn({ email: "demo@test.com", password: "wrong-pass" });
      expect(res).toBeNull();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "LOGIN_FAILED",
            userId: "user-1",
            metadata: { email: "demo@test.com", reason: "wrong_password" },
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

      const res = await authorizeFn({ email: "demo@test.com", password: "correct-pass" });
      expect(res).toEqual({
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
            entityId: "user-1",
          }),
        })
      );
    });
  });

  describe("Callbacks - jwt", () => {
    it("adiciona id e role ao token na primeira chamada (se user for fornecido)", async () => {
      const jwtFn = capturedOptions.callbacks.jwt;
      const token = {};
      const user = { id: "user-123", role: "ADMIN" };
      const res = await jwtFn({ token, user });
      expect(res).toEqual({ id: "user-123", role: "ADMIN" });
    });

    it("retorna o token inalterado se user não for fornecido", async () => {
      const jwtFn = capturedOptions.callbacks.jwt;
      const token = { id: "existing-id", role: "USER" };
      const res = await jwtFn({ token });
      expect(res).toEqual(token);
    });
  });

  describe("Callbacks - session", () => {
    it("adiciona id e role do token à sessão", async () => {
      const sessionFn = capturedOptions.callbacks.session;
      const session = { user: {} };
      const token = { id: "user-123", role: "ADMIN" };
      const res = await sessionFn({ session, token });
      expect(res.user.id).toBe("user-123");
      expect(res.user.role).toBe("ADMIN");
    });

    it("retorna session inalterada se user não existir na session", async () => {
      const sessionFn = capturedOptions.callbacks.session;
      const session = {};
      const token = { id: "user-123", role: "ADMIN" };
      const res = await sessionFn({ session, token });
      expect(res).toEqual({});
    });
  });
});
