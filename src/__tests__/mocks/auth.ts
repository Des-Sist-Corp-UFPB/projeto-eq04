import type { Session } from "next-auth";

export const mockAuth = jest.fn<Promise<Session | null>, []>();

export function mockAdminSession(): Session {
  return {
    user: {
      id: "admin-1",
      name: "Administrador",
      email: "admin@dscebooks.com",
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

export function mockUserSession(): Session {
  return {
    user: {
      id: "user-1",
      name: "Usuário Demo",
      email: "demo@dscebooks.com",
      role: "USER",
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}
