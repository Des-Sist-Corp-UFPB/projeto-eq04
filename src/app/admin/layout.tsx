import Link from "next/link";

// Toda a seção /admin é dinâmica — consulta o banco em tempo real.
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <nav className="flex gap-4 border-b border-neutral-200 pb-3 text-sm">
        <Link href="/admin" className="font-medium hover:text-brand-600">
          Dashboard
        </Link>
        <Link href="/admin/books" className="font-medium hover:text-brand-600">
          Livros
        </Link>
        <Link
          href="/admin/audit-logs"
          className="font-medium hover:text-brand-600"
        >
          Logs de auditoria
        </Link>
      </nav>
      {children}
    </div>
  );
}
