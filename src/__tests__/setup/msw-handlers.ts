import { http, HttpResponse } from "msw";
import { mockAuthors, mockBooks, mockCategories } from "./mock-data";

export { mockBooks, mockAuthors, mockCategories };

export const handlers = [
  http.get("/api/books", () => HttpResponse.json(mockBooks)),
  http.post("/api/books", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: "new-book", ...body }, { status: 201 });
  }),
  http.get("/api/authors", () => HttpResponse.json(mockAuthors)),
  http.get("/api/categories", () => HttpResponse.json(mockCategories)),
  http.post("/api/orders", () =>
    HttpResponse.json({ id: "order-1", status: "PAID" }, { status: 201 })
  ),
  http.post("/api/logout", () => HttpResponse.json({ ok: true })),
  http.post("/api/recommendations", () =>
    HttpResponse.json({
      recommendations: [
        {
          bookId: "book-1",
          title: "Fundação",
          reason: "Baseado no seu interesse em ficção científica.",
        },
      ],
    })
  ),
];
