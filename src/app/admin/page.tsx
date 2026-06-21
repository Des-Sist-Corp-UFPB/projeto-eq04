import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [userCount, bookCount, orderCount, last24hLogs] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.order.count(),
    prisma.auditLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const stats = [
    { label: "Usuários", value: userCount },
    { label: "Livros no catálogo", value: bookCount },
    { label: "Pedidos realizados", value: orderCount },
    { label: "Eventos de auditoria (24h)", value: last24hLogs },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
