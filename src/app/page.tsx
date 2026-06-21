import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { q?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim();

  const books = await prisma.book.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { author: true, categories: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo de e-books</h1>
        <p className="text-neutral-500">
          Encontre seu próximo livro digital favorito.
        </p>
      </div>

      <form action="/" className="max-w-md">
        <Input
          name="q"
          placeholder="Buscar por título ou autor..."
          defaultValue={q}
        />
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <h2 className="font-medium">{book.title}</h2>
              <p className="text-sm text-neutral-500">{book.author.name}</p>
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
              <p className="mt-3 font-semibold text-brand-700">
                R$ {Number(book.price).toFixed(2)}
              </p>
            </Card>
          </Link>
        ))}

        {books.length === 0 && (
          <p className="col-span-full text-neutral-500">
            Nenhum livro encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
