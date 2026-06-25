/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import AdminDashboardPage from "../page";
import { prismaMock } from "@/__tests__/mocks/prisma";

describe("AdminDashboardPage", () => {
  it("renders statistics cards using prisma counts", async () => {
    prismaMock.user.count.mockResolvedValue(10);
    prismaMock.book.count.mockResolvedValue(5);
    prismaMock.order.count.mockResolvedValue(15);
    prismaMock.auditLog.count.mockResolvedValue(20);

    const jsx = await AdminDashboardPage();
    const { getByText } = render(jsx);

    expect(getByText("Dashboard")).toBeInTheDocument();
    expect(getByText("Usuários")).toBeInTheDocument();
    expect(getByText("10")).toBeInTheDocument();

    expect(getByText("Livros no catálogo")).toBeInTheDocument();
    expect(getByText("5")).toBeInTheDocument();

    expect(getByText("Pedidos realizados")).toBeInTheDocument();
    expect(getByText("15")).toBeInTheDocument();

    expect(getByText("Eventos de auditoria (24h)")).toBeInTheDocument();
    expect(getByText("20")).toBeInTheDocument();

    expect(prismaMock.user.count).toHaveBeenCalled();
    expect(prismaMock.book.count).toHaveBeenCalled();
    expect(prismaMock.order.count).toHaveBeenCalled();
    expect(prismaMock.auditLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    );
  });
});
