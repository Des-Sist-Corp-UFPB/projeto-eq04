/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AuditLogsPage from "../page";

describe("AuditLogsPage", () => {
  it("renders log table with fetched data and filters when select option changes", async () => {
    const originalFetch = global.fetch;
    const mockFetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const actionParam = new URL(url).searchParams.get("action");

      if (actionParam === "LOGIN_SUCCESS") {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "log-1",
              action: "LOGIN_SUCCESS",
              entity: "User",
              entityId: "user-1",
              ipAddress: "127.0.0.1",
              createdAt: "2026-06-25T20:00:00.000Z",
              user: { name: "Usuário Demo", email: "demo@dscebooks.com" },
            },
          ],
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "log-1",
            action: "LOGIN_SUCCESS",
            entity: "User",
            entityId: "user-1",
            ipAddress: "127.0.0.1",
            createdAt: "2026-06-25T20:00:00.000Z",
            user: { name: "Usuário Demo", email: "demo@dscebooks.com" },
          },
          {
            id: "log-2",
            action: "BOOK_CREATE",
            entity: "Book",
            entityId: "book-1",
            ipAddress: "127.0.0.1",
            createdAt: "2026-06-25T20:05:00.000Z",
            user: { name: "Admin", email: "admin@dscebooks.com" },
          },
        ],
      } as Response;
    });

    global.fetch = mockFetch;

    render(<AuditLogsPage />);

    expect(
      screen.getByRole("heading", { name: /logs de auditoria/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("LOGIN_SUCCESS")).toBeInTheDocument();
      expect(screen.getByText("BOOK_CREATE")).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/filtrar/i);
    fireEvent.change(select, { target: { value: "LOGIN_SUCCESS" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining("action=LOGIN_SUCCESS")
      );
    });

    global.fetch = originalFetch;
  });
});
