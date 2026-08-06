"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  name: string;
}

export function NewBookForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Option[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    // Validação no navegador é só uma conveniência (feedback imediato) —
    // a validação que realmente importa acontece no servidor, checando os
    // bytes do arquivo, não apenas o nome/extensão.
    if (file && file.type !== "application/pdf") {
      setError("O arquivo do e-book precisa ser um PDF.");
      event.target.value = "";
      setPdfFile(null);
      return;
    }

    setError(null);
    setPdfFile(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("price", price);
    formData.set("authorName", authorName);
    categoryIds.forEach((id) => formData.append("categoryIds", id));
    if (pdfFile) {
      formData.set("pdf", pdfFile);
    }

    const response = await fetch("/api/books", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      const message =
        typeof data.error === "string"
          ? data.error
          : data.error?.pdf?.[0] ??
            Object.values(data.error ?? {})?.[0]?.[0] ??
            "Não foi possível criar o livro.";
      setError(message);
      return;
    }

    setTitle("");
    setPrice("");
    setAuthorName("");
    setCategoryIds([]);
    setPdfFile(null);
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
      <Input
        placeholder="Nome do autor"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        required
      />

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

      <div className="space-y-1">
        <label className="block text-sm font-medium text-neutral-700">
          Arquivo do e-book (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handlePdfChange}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-brand-700"
        />
        {pdfFile && (
          <p className="text-xs text-neutral-500">
            {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(1)} MB)
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Adicionar livro"}
      </Button>
    </form>
  );
}