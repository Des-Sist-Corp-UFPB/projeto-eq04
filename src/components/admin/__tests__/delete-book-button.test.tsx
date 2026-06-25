/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { renderWithProviders, screen, userEvent } from "@/__tests__/utils/test-utils";
import { DeleteBookButton } from "@/components/admin/delete-book-button";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe("DeleteBookButton", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    global.confirm = jest.fn(() => true);
  });

  it("exclui livro após confirmação", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteBookButton bookId="book-1" />);

    await user.click(screen.getByRole("button", { name: /excluir/i }));

    expect(global.confirm).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("não exclui quando usuário cancela", async () => {
    global.confirm = jest.fn(() => false);
    const user = userEvent.setup();
    renderWithProviders(<DeleteBookButton bookId="book-1" />);

    await user.click(screen.getByRole("button", { name: /excluir/i }));

    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
