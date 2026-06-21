import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { BuyButton } from "@/components/buy-button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function BookDetailPage({ params }: PageProps) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: { author: true, categories: true },
  });

  if (!book) notFound();

  return (
    <Card className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{book.title}</h1>
      <p className="text-neutral-500">por {book.author.name}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {book.categories.map((c) => (
          <span
            key={c.id}
            className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
          >
            {c.name}
          </span>
        ))}
      </div>

      <p className="mt-4 text-neutral-700">
        {book.description ?? "Sem descrição disponível."}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xl font-semibold text-brand-700">
          R$ {Number(book.price).toFixed(2)}
        </p>
        <BuyButton bookId={book.id} />
      </div>
    </Card>
  );
}
