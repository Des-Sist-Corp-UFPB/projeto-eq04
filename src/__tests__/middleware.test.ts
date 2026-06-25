import { NextRequest, NextResponse } from "next/server";

jest.mock("@/auth", () => ({
  auth: (callback: (req: NextRequest & { auth?: unknown }) => NextResponse) =>
    callback,
}));

import middleware from "@/middleware";

function createRequest(
  pathname: string,
  auth?: { user: { role: string } } | null
) {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: url,
    auth: auth ?? undefined,
    url: url.toString(),
  } as NextRequest & { auth?: { user: { role: string } } };
}

describe("Middleware de rotas protegidas", () => {
  it("redireciona usuário não autenticado de /admin para /login", () => {
    const response = middleware(createRequest("/admin", null));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/login");
  });

  it("redireciona usuário comum de /admin para /", () => {
    const response = middleware(
      createRequest("/admin", { user: { role: "USER" } })
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/");
  });

  it("permite acesso de admin a /admin", () => {
    const response = middleware(
      createRequest("/admin/books", { user: { role: "ADMIN" } })
    );

    expect(response?.headers.get("x-middleware-next")).toBe("1");
  });

  it("redireciona visitante de /library para /login", () => {
    const response = middleware(createRequest("/library", null));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/login");
  });

  it("permite usuário autenticado em /recommendations", () => {
    const response = middleware(
      createRequest("/recommendations", { user: { role: "USER" } })
    );

    expect(response?.headers.get("x-middleware-next")).toBe("1");
  });
});
