"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Recommendation {
  bookId: string;
  title: string;
  reason: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/recommendations", { method: "POST" });
    const data = await response.json();

    setLoading(false);
    setRequested(true);

    if (!response.ok) {
      setError(data.error ?? "Não foi possível gerar recomendações.");
      return;
    }

    setRecommendations(data.recommendations);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl bg-brand-700 p-6 md:p-8 text-white shadow-md">
        <div className="space-y-2 max-w-xl">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-100">
            🤖 Assistente de Leitura
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Recomendações com Inteligência Artificial</h1>
          <p className="text-sm text-brand-100/90 leading-relaxed">
            Nossa IA analisa seu histórico de compras, categorias favoritas e interesses pessoais para indicar as leituras mais compatíveis do nosso catálogo para você.
          </p>
        </div>
        <div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{ color: "#8a5226" }}
            className="w-full md:w-auto bg-white text-brand-800 hover:bg-brand-50 px-6 py-3 rounded-xl font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin text-brand-800" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Analisando...
        </span>
      ) : (
        "Gerar Recomendações"
      )}
    </button>
    </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200 shadow-sm">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">Erro ao obter recomendações</p>
            <p className="text-xs text-red-600/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Skeleton Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
              <div className="h-28 rounded-xl bg-neutral-100" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-100" />
                <div className="h-3 w-1/2 rounded bg-neutral-100" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="h-3 w-full rounded bg-neutral-100" />
                <div className="h-3 w-5/6 rounded bg-neutral-100" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {recommendations.map((rec) => (
            <Card key={rec.bookId} className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="space-y-3">
                <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-4 text-brand-600 shadow-inner">
                  <span className="text-3xl">📘</span>
                </div>
                <div className="space-y-1">
                  <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                    Recomendado
                  </span>
                  <h2 className="text-lg font-bold leading-snug text-neutral-900">{rec.title}</h2>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed italic">
                  &ldquo;{rec.reason}&rdquo;
                </p>
              </div>
              <div className="mt-6 border-t border-neutral-100 pt-4">
                <a href={`/books/${rec.bookId}`} className="block">
                  <Button variant="secondary" className="w-full py-2 rounded-xl text-xs font-semibold">
                    Ver detalhes
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && requested && recommendations.length === 0 && !error && (
        <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-white/50 p-8">
          <span className="mx-auto block text-5xl mb-4">💡</span>
          <h3 className="text-lg font-bold text-neutral-800">Sem recomendações disponíveis</h3>
          <p className="text-neutral-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">
            Nenhuma recomendação disponível no momento. Experimente comprar mais livros ou atualizar seus interesses no seu perfil de usuário para calibrar nosso algoritmo.
          </p>
        </div>
      )}
    </div>
  );
}
