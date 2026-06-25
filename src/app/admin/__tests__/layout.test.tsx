/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import AdminLayout from "../layout";

describe("AdminLayout", () => {
  it("renders navigation links and children", () => {
    const { getByRole, getByText } = render(
      <AdminLayout>
        <div data-testid="admin-child">Admin Page Content</div>
      </AdminLayout>
    );

    expect(getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/admin");
    expect(getByRole("link", { name: /livros/i })).toHaveAttribute("href", "/admin/books");
    expect(getByRole("link", { name: /logs de auditoria/i })).toHaveAttribute("href", "/admin/audit-logs");
    expect(getByText("Admin Page Content")).toBeInTheDocument();
  });
});
