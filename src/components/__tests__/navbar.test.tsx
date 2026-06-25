/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { renderWithProviders, screen } from "@/__tests__/utils/test-utils";
import { mockUserSession, mockAdminSession } from "@/__tests__/mocks/auth";
import { Navbar } from "@/components/navbar";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Navbar", () => {
  it("exibe links de login e registro quando o usuário não está autenticado", () => {
    // Arrange & Act
    renderWithProviders(<Navbar />, { session: null });

    // Assert
    expect(screen.getByRole("link", { name: /entrar/i })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute(
      "href",
      "/register"
    );
    expect(screen.queryByText(/minha biblioteca/i)).not.toBeInTheDocument();
  });

  it("exibe navegação do usuário autenticado", () => {
    renderWithProviders(<Navbar />, { session: mockUserSession() });

    expect(screen.getByRole("link", { name: /minha biblioteca/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /recomendações/i })).toBeInTheDocument();
    expect(screen.getByText("Usuário Demo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("exibe link do painel admin apenas para administradores", () => {
    renderWithProviders(<Navbar />, { session: mockAdminSession() });

    expect(screen.getByRole("link", { name: /painel admin/i })).toBeInTheDocument();
  });

  it("não exibe painel admin para usuário comum", () => {
    renderWithProviders(<Navbar />, { session: mockUserSession() });

    expect(screen.queryByRole("link", { name: /painel admin/i })).not.toBeInTheDocument();
  });

  it("não possui violações básicas de acessibilidade", async () => {
    const { container } = renderWithProviders(<Navbar />, {
      session: mockUserSession(),
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
