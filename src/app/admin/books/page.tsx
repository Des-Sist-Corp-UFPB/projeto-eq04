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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <h1 className="mb-4 text-2xl font-semibold">Gerenciar livros</h1>
        <div className="space-y-3">
          {books.map((book) => (
            <Card key={book.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{book.title}</p>
                <p className="text-sm text-neutral-500">{book.author.name}</p>
              </div>
              <DeleteBookButton bookId={book.id} />
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Novo livro</h2>
        <NewBookForm />
      </Card>
    </div>
  );
}
