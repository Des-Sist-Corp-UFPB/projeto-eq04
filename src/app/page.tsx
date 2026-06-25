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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
          Catálogo de E-books
        </h1>
        <p className="text-lg text-neutral-500">
          Encontre seu próximo livro digital favorito no nosso acervo.
        </p>
      </div>

      <div className="relative max-w-md">
        <form action="/" className="relative flex items-center">
          <span className="absolute left-3 text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <Input
            name="q"
            placeholder="Buscar por título ou autor..."
            defaultValue={q}
            className="pl-10 pr-4 py-3 rounded-xl border-neutral-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 transition-all duration-200"
          />
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`} className="group">
            <Card className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
              <div className="space-y-3">
                <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-6 text-brand-600 shadow-inner group-hover:from-brand-100 group-hover:to-brand-200/50 transition-colors duration-300">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📖</span>
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold leading-snug text-neutral-900 group-hover:text-brand-600 transition-colors duration-200">
                    {book.title}
                  </h2>
                  <p className="text-sm font-medium text-neutral-500">por {book.author.name}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {book.categories.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 border-t border-neutral-100 pt-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Preço</span>
                <p className="text-lg font-extrabold text-brand-700">
                  R$ {Number(book.price).toFixed(2)}
                </p>
              </div>
            </Card>
          </Link>
        ))}

        {books.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <span className="mx-auto block text-4xl mb-3">🔍</span>
            <p className="text-lg font-medium text-neutral-600">Nenhum livro encontrado.</p>
            <p className="text-sm text-neutral-400">Tente buscar por termos diferentes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
