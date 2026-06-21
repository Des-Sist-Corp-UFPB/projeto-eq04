import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) return null; // protegido pelo middleware

  const items = await prisma.libraryItem.findMany({
    where: { userId: session.user.id },
    include: { book: { include: { author: true } } },
    orderBy: { acquiredAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Minha biblioteca</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id}>
            <h2 className="font-medium">{item.book.title}</h2>
            <p className="text-sm text-neutral-500">{item.book.author.name}</p>
            <p className="mt-2 text-xs text-neutral-400">
              Adquirido em{" "}
              {new Date(item.acquiredAt).toLocaleDateString("pt-BR")}
            </p>
          </Card>
        ))}

        {items.length === 0 && (
          <p className="col-span-full text-neutral-500">
            Você ainda não possui livros. Explore o catálogo!
          </p>
        )}
      </div>
    </div>
  );
}
