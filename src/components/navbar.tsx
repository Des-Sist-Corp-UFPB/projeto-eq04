"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  async function handleLogout() {
    // registra o evento de auditoria enquanto a sessão ainda é válida,
    // só então encerra a sessão de fato.
    await fetch("/api/logout", { method: "POST" });
    await signOut({ callbackUrl: "/" });
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          DSC E-books
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <Link href="/library" className="hover:text-brand-600">
                Minha biblioteca
              </Link>
              <Link href="/recommendations" className="hover:text-brand-600">
                Recomendações
              </Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-brand-600">
                  Painel admin
                </Link>
              )}
              <span className="text-neutral-500">{session.user.name}</span>
              <Button variant="ghost" onClick={handleLogout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand-600">
                Entrar
              </Link>
              <Link href="/register">
                <Button>Criar conta</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
