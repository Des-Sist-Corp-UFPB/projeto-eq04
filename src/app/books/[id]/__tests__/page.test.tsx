/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import BookDetailPage from "../page";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { notFound } from "next/navigation";

jest.mock("@/components/buy-button", () => ({
  BuyButton: ({ bookId }: { bookId: string }) => (
    <button data-testid={`buy-${bookId}`}>Buy {bookId}</button>
  ),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("BookDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders book details when book exists", async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      id: "book-123",
      title: "Science Fiction Novel",
      description: "An epic space adventure.",
      price: "19.99",
      authorId: "author-1",
      author: { name: "Isaac Asimov" },
      categories: [{ id: "cat-1", name: "Sci-Fi" }],
    } as any);

    const jsx = await BookDetailPage({ params: { id: "book-123" } });
    const { getByText, getByTestId } = render(jsx);

    expect(getByText("Science Fiction Novel")).toBeInTheDocument();
    expect(getByText("Isaac Asimov")).toBeInTheDocument();
    expect(getByText("Sci-Fi")).toBeInTheDocument();
    expect(getByText("An epic space adventure.")).toBeInTheDocument();
    expect(getByText("R$ 19.99")).toBeInTheDocument();
    expect(getByTestId("buy-book-123")).toBeInTheDocument();
  });

  it("calls notFound when book does not exist", async () => {
    prismaMock.book.findUnique.mockResolvedValue(null);

    await expect(
      BookDetailPage({ params: { id: "inexistente" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
