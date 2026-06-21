"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir este livro? Essa ação não pode ser desfeita.")) {
      return;
    }
    setLoading(true);
    await fetch(`/api/books/${bookId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button variant="danger" onClick={handleDelete} disabled={loading}>
      {loading ? "Excluindo..." : "Excluir"}
    </Button>
  );
}
