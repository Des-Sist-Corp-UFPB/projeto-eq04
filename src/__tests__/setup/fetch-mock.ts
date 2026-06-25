import {
  mockAuthors,
  mockBooks,
  mockCategories,
} from "./mock-data";

/**
 * Mock de fetch para testes de componentes (jsdom).
 * Espelha os contratos definidos em msw-handlers.ts.
 */
export function applyFetchMock() {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const path = new URL(url, "http://localhost").pathname;

    if (method === "GET" && path === "/api/authors") {
      return jsonResponse(mockAuthors);
    }
    if (method === "GET" && path === "/api/categories") {
      return jsonResponse(mockCategories);
    }
    if (method === "GET" && path === "/api/books") {
      return jsonResponse(mockBooks);
    }
    if (method === "POST" && path === "/api/books") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return jsonResponse({ id: "new-book", ...body }, 201);
    }
    if (method === "POST" && path === "/api/orders") {
      return jsonResponse({ id: "order-1", status: "PAID" }, 201);
    }
    if (method === "POST" && path === "/api/logout") {
      return jsonResponse({ ok: true });
    }
    if (method === "POST" && path === "/api/register") {
      return jsonResponse({ id: "user-new", name: "Novo", email: "novo@test.com" }, 201);
    }
    if (method === "DELETE" && path.startsWith("/api/books/")) {
      return jsonResponse({ ok: true });
    }
    if (method === "POST" && path === "/api/recommendations") {
      return jsonResponse({
        recommendations: [
          {
            bookId: "book-1",
            title: "Fundação",
            reason: "Baseado no seu interesse em ficção científica.",
          },
        ],
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  }) as typeof fetch;
}

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}
