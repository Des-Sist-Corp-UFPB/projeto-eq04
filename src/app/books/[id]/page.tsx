import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { BuyButton } from "@/components/buy-button";
import Link from "next/link";

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
    <div className="space-y-6">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-brand-600 transition-colors"
      >
        <span>←</span> Voltar para o catálogo
      </Link>

      <Card className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 shadow-md">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left Column: Cover representation */}
          <div className="flex aspect-[3/4] w-full max-w-sm mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 shadow-inner p-12 text-brand-600 border border-brand-100">
            <div className="text-center space-y-4">
              <span className="block text-7xl select-none filter drop-shadow">📖</span>
              <p className="font-bold text-sm tracking-wide text-brand-700/80 uppercase">Edição Digital</p>
            </div>
          </div>

          {/* Right Column: Book details */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                  {book.title}
                </h1>
                <p className="text-lg font-medium text-neutral-500">
                  por <span className="text-neutral-700 font-semibold">{book.author.name}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {book.categories.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-100"
                  >
                    {c.name}
                  </span>
                ))}
              </div>

              <div className="border-t border-neutral-100 my-4" />

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Sinopse</h3>
                <p className="text-neutral-600 leading-relaxed text-sm whitespace-pre-line">
                  {book.description ?? "Sem descrição disponível."}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-50 p-5 flex items-center justify-between border border-neutral-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Preço final</p>
                <p className="text-2xl font-extrabold text-brand-700 mt-0.5">
                  R$ {Number(book.price).toFixed(2)}
                </p>
              </div>
              <div className="w-auto">
                <BuyButton bookId={book.id} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
