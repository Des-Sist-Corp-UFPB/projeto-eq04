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
    { 
      label: "Usuários", 
      value: userCount, 
      icon: "👥", 
      color: "border-blue-500 text-blue-600 bg-blue-50" 
    },
    { 
      label: "Livros no catálogo", 
      value: bookCount, 
      icon: "📚", 
      color: "border-brand-500 text-brand-600 bg-brand-50" 
    },
    { 
      label: "Pedidos realizados", 
      value: orderCount, 
      icon: "🛒", 
      color: "border-green-500 text-green-600 bg-green-50" 
    },
    { 
      label: "Eventos de auditoria (24h)", 
      value: last24hLogs, 
      icon: "🛡️", 
      color: "border-purple-500 text-purple-600 bg-purple-50" 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Estatísticas gerais e métricas de uso da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`flex items-center gap-4 rounded-2xl border-l-4 ${stat.color} bg-white p-5 shadow-sm`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-inner text-2xl">
              {stat.icon}
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{stat.label}</p>
              <p className="text-3xl font-extrabold text-neutral-900 leading-none">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
