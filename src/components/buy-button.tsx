"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function BuyButton({ bookId }: { bookId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleBuy() {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookIds: [bookId] }),
    });
    setLoading(false);

    if (response.ok) {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return (
      <p className="text-sm font-medium text-green-700">
        Comprado! Disponível na sua biblioteca.
      </p>
    );
  }

  return (
    <Button onClick={handleBuy} disabled={loading}>
      {loading ? "Processando..." : "Comprar agora"}
    </Button>
  );
}
