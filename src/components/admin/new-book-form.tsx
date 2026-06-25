"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  name: string;
}

export function NewBookForm() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/authors")
      .then((r) => r.json())
      .then(setAuthors);
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        price: Number(price),
        authorId,
        categoryIds,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : "Não foi possível criar o livro."
      );
      return;
    }

    setTitle("");
    setPrice("");
    setAuthorId("");
    setCategoryIds([]);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Input
        type="number"
        step="0.01"
        placeholder="Preço"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <select
        value={authorId}
        onChange={(e) => setAuthorId(e.target.value)}
        required
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      >
        <option value="">Selecione um autor</option>
        {authors.map((author) => (
          <option key={author.id} value={author.id}>
            {author.name}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            onClick={() => toggleCategory(category.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              categoryIds.includes(category.id)
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-neutral-300 text-neutral-600"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Adicionar livro"}
      </Button>
    </form>
  );
}
