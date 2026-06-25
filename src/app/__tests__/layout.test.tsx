/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import RootLayout from "../layout";

jest.mock("@/components/navbar", () => ({
  Navbar: () => <div data-testid="mock-navbar">Navbar</div>,
}));

jest.mock("@/components/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("renders layout with navbar and children", () => {
    const { getByTestId, getByText } = render(
      <RootLayout>
        <div data-testid="test-child">Child Content</div>
      </RootLayout>
    );

    expect(getByTestId("mock-providers")).toBeInTheDocument();
    expect(getByTestId("mock-navbar")).toBeInTheDocument();
    expect(getByTestId("test-child")).toBeInTheDocument();
    expect(getByText("Child Content")).toBeInTheDocument();
  });
});
