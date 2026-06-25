/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import AdminBooksPage from "../page";
import { prismaMock } from "@/__tests__/mocks/prisma";

jest.mock("@/components/admin/new-book-form", () => ({
  NewBookForm: () => <div data-testid="mock-new-book-form">New Book Form</div>,
}));

jest.mock("@/components/admin/delete-book-button", () => ({
  DeleteBookButton: ({ bookId }: { bookId: string }) => (
    <button data-testid={`delete-btn-${bookId}`}>Delete {bookId}</button>
  ),
}));

describe("AdminBooksPage", () => {
  it("renders a list of books and the new book form", async () => {
    prismaMock.book.findMany.mockResolvedValue([
      {
        id: "book-123",
        title: "Test E-Book",
        authorId: "author-1",
        author: { name: "Author Test" },
        createdAt: new Date(),
      },
    ] as any);

    const jsx = await AdminBooksPage();
    const { getByText, getByTestId } = render(jsx);

    expect(getByText("Gerenciar livros")).toBeInTheDocument();
    expect(getByText("Test E-Book")).toBeInTheDocument();
    expect(getByText("Author Test")).toBeInTheDocument();
    expect(getByTestId("delete-btn-book-123")).toBeInTheDocument();
    expect(getByTestId("mock-new-book-form")).toBeInTheDocument();
  });
});
