import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
          Minha Biblioteca
        </h1>
        <p className="text-lg text-neutral-500">
          Acesse seus e-books adquiridos e continue suas leituras.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="space-y-4">
              <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-brand-100/80 to-brand-50/50 p-6 text-brand-700 shadow-inner">
                <span className="text-4xl select-none">📖</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold leading-snug text-neutral-900">{item.book.title}</h2>
                <p className="text-sm font-medium text-neutral-500">por {item.book.author.name}</p>
                <p className="text-xs text-neutral-400 pt-1">
                  Adquirido em{" "}
                  {new Date(item.acquiredAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-4 flex gap-2">
              <Button className="flex-1 py-2 rounded-xl text-xs font-semibold shadow-sm">
                Ler agora
              </Button>
              <Button variant="secondary" className="flex-1 py-2 rounded-xl text-xs font-semibold">
                Download
              </Button>
            </div>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-neutral-200 rounded-2xl bg-white/50 p-8">
            <span className="mx-auto block text-5xl mb-4">📚</span>
            <h3 className="text-lg font-bold text-neutral-800">Sua biblioteca está vazia</h3>
            <p className="text-neutral-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">
              Você ainda não possui nenhum e-book. Explore nosso catálogo para encontrar ótimas leituras!
            </p>
            <Link href="/" className="inline-block mt-5">
              <Button className="rounded-xl font-semibold shadow-sm px-6 py-2.5">
                Explorar catálogo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
