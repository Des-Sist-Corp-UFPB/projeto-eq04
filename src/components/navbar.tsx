"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  async function handleLogout() {
    // registra o evento de auditoria enquanto a sessão ainda é válida,
    // só então encerra a sessão de fato.
    await fetch("/api/logout", { method: "POST" });
    await signOut({ callbackUrl: "/" });
  }

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-brand-700 transition-colors hover:text-brand-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-base shadow-sm">
            📚
          </span>
          DSC E-books
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {session?.user ? (
            <>
              <Link 
                href="/library" 
                className={`font-medium transition-colors hover:text-brand-600 ${
                  isActive("/library") ? "text-brand-600 font-semibold" : "text-neutral-600"
                }`}
              >
                Minha biblioteca
              </Link>
              <Link 
                href="/recommendations" 
                className={`font-medium transition-colors hover:text-brand-600 ${
                  isActive("/recommendations") ? "text-brand-600 font-semibold" : "text-neutral-600"
                }`}
              >
                Recomendações
              </Link>
              {session.user.role === "ADMIN" && (
                <Link 
                  href="/admin" 
                  className={`font-medium transition-colors hover:text-brand-600 ${
                    pathname?.startsWith("/admin") ? "text-brand-600 font-semibold" : "text-neutral-600"
                  }`}
                >
                  Painel admin
                </Link>
              )}
              <div className="flex items-center gap-2 border-l border-neutral-200 pl-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 text-xs shadow-inner">
                  {session.user.name ? session.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U"}
                </span>
                <span className="hidden max-w-[100px] truncate text-xs font-medium text-neutral-700 md:inline">
                  {session.user.name}
                </span>
                <Button variant="ghost" onClick={handleLogout} className="text-neutral-500 hover:text-red-600 px-2 py-1 h-auto text-xs font-normal">
                  Sair
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="font-medium text-neutral-600 transition-colors hover:text-brand-600"
              >
                Entrar
              </Link>
              <Link href="/register">
                <Button className="shadow-sm">Criar conta</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
