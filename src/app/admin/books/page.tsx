import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { NewBookForm } from "@/components/admin/new-book-form";
import { DeleteBookButton } from "@/components/admin/delete-book-button";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const books = await prisma.book.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Gerenciar Livros</h1>
        <p className="text-sm text-neutral-500 mt-1">Adicione, edite ou remova e-books do catálogo da loja.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Books List (Left) */}
        <div className="md:col-span-2 space-y-3">
          {books.map((book) => (
            <Card key={book.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl shadow-inner">
                  📖
                </span>
                <div>
                  <p className="font-bold text-neutral-800 leading-snug">{book.title}</p>
                  <p className="text-xs font-semibold text-brand-600 mt-0.5">{book.author.name}</p>
                </div>
              </div>
              <DeleteBookButton bookId={book.id} />
            </Card>
          ))}

          {books.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-xl bg-white/50">
              <span className="text-3xl block mb-2">📚</span>
              <p className="text-sm font-medium text-neutral-600">Nenhum livro no catálogo.</p>
            </div>
          )}
        </div>

        {/* Form Container (Right - Sticky) */}
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <Card className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
                <span>➕</span> Novo E-book
              </h2>
              <NewBookForm />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
