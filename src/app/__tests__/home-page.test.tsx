/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { prismaMock } from "@/__tests__/mocks/prisma";
import { mockBooks } from "@/__tests__/setup/mock-data";
import HomePage from "@/app/page";

describe("HomePage (/)", () => {
  it("renderiza catálogo de livros", async () => {
    prismaMock.book.findMany.mockResolvedValue(mockBooks as any);

    const jsx = await HomePage({ searchParams: {} });
    const { container } = render(jsx);

    expect(container).toHaveTextContent("Catálogo de e-books");
    expect(container).toHaveTextContent("Fundação");
    expect(container).toHaveTextContent("Isaac Asimov");
    expect(container).toHaveTextContent("R$ 29.90");
  });

  it("exibe mensagem quando nenhum livro é encontrado", async () => {
    prismaMock.book.findMany.mockResolvedValue([]);

    const jsx = await HomePage({ searchParams: { q: "inexistente" } });
    const { container } = render(jsx);

    expect(container).toHaveTextContent("Nenhum livro encontrado.");
  });

  it("aplica filtro de busca via searchParams", async () => {
    prismaMock.book.findMany.mockResolvedValue(mockBooks as any);

    await HomePage({ searchParams: { q: "asimov" } });

    expect(prismaMock.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: "asimov", mode: "insensitive" } },
          ]),
        }),
      })
    );
  });
});
