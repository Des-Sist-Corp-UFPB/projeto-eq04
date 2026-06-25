/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockBooks } from "@/__tests__/setup/mock-data";
import BookDetailPage from "@/app/books/[id]/page";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

describe("BookDetailPage (/books/[id])", () => {
  it("renderiza detalhes do livro", async () => {
    prismaMock.book.findUnique.mockResolvedValue(mockBooks[0] as any);

    const jsx = await BookDetailPage({ params: { id: "book-1" } });
    const { container } = render(jsx);

    expect(container).toHaveTextContent("Fundação");
    expect(container).toHaveTextContent("Isaac Asimov");
    expect(container).toHaveTextContent("R$ 29.90");
  });
});
