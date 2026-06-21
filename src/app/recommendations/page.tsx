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
  const [recommendations, setRecommendations] = useState<Recommendation[]>(
    []
  );
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recomendações para você</h1>
          <p className="text-neutral-500">
            Geradas pela IA com base no seu histórico, categorias favoritas e
            interesses.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Gerando..." : "Gerar recomendações"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {recommendations.map((rec) => (
          <Card key={rec.bookId}>
            <h2 className="font-medium">{rec.title}</h2>
            <p className="mt-2 text-sm text-neutral-500">{rec.reason}</p>
          </Card>
        ))}
      </div>

      {!loading && requested && recommendations.length === 0 && !error && (
        <p className="text-neutral-500">
          Nenhuma recomendação disponível no momento — compre alguns livros
          ou atualize seus interesses no perfil para melhorar os resultados.
        </p>
      )}
    </div>
  );
}
