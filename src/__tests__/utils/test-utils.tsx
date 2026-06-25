import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import type { Session } from "next-auth";

export const mockSignIn = jest.fn();
export const mockSignOut = jest.fn();

let currentSession: Session | null = null;

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useSession: () => ({ data: currentSession }),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

function AllProviders({ children, session = null }: ProvidersProps) {
  currentSession = session;
  return <>{children}</>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { session?: Session | null }
) {
  const { session, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders session={session}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
