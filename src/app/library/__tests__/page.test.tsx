/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import LibraryPage from "@/app/library/page";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockAuth, mockUserSession } from "@/__tests__/mocks/auth";

describe("LibraryPage (/library)", () => {
  it("lista livros da biblioteca do usuário", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    prismaMock.libraryItem.findMany.mockResolvedValue([
      {
        id: "item-1",
        userId: "user-1",
        bookId: "book-1",
        acquiredAt: new Date("2024-06-01"),
        book: {
          id: "book-1",
          title: "Fundação",
          author: { name: "Isaac Asimov" },
        },
      },
    ] as any);

    const jsx = await LibraryPage();
    const { container } = render(jsx);

    expect(container).toHaveTextContent("Minha biblioteca");
    expect(container).toHaveTextContent("Fundação");
    expect(prismaMock.libraryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("exibe estado vazio quando usuário não possui livros", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    prismaMock.libraryItem.findMany.mockResolvedValue([]);

    const jsx = await LibraryPage();
    const { container } = render(jsx);

    expect(container).toHaveTextContent("Você ainda não possui livros");
  });
});
