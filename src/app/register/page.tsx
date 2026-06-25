"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a10.05 10.05 0 011.875.175M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 3-4 7-9 7m9-7c0-1.5-.9-3.2-2.4-4.6M3 3l18 18" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [interests, setInterests] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, interests }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : "Não foi possível criar a conta."
      );
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto my-12 max-w-md px-4">
      <Card className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl text-brand-700 shadow-inner mb-3">
            ✨
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Criar uma conta</h1>
          <p className="text-sm text-neutral-500 mt-1">Cadastre-se para começar a colecionar e-books.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500" htmlFor="name-input">
              Nome Completo
            </label>
            <Input
              id="name-input"
              placeholder="Digite seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="py-2.5 rounded-xl border-neutral-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500" htmlFor="email-input">
              E-mail
            </label>
            <Input
              id="email-input"
              type="email"
              placeholder="seu-email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-2.5 rounded-xl border-neutral-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500" htmlFor="password-input">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 py-2.5 rounded-xl border-neutral-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500" htmlFor="interests-input">
              Interesses
            </label>
            <Input
              id="interests-input"
              placeholder="Ex: ficção científica, finanças, história..."
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="py-2.5 rounded-xl border-neutral-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <span>⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:bg-brand-700">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Criando...
              </span>
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center border-t border-neutral-100 pt-4 text-sm text-neutral-500">
          Já possui uma conta?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Faça login
          </Link>
        </div>
      </Card>
    </div>
  );
}