"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

const ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "USER_REGISTER",
  "BOOK_CREATE",
  "BOOK_UPDATE",
  "BOOK_DELETE",
  "AUTHOR_CREATE",
  "CATEGORY_CREATE",
  "ORDER_CREATE",
  "RECOMMENDATION_REQUEST",
];

function getBadgeStyle(action: string): string {
  switch (action) {
    case "LOGIN_SUCCESS":
    case "USER_REGISTER":
    case "ORDER_CREATE":
      return "bg-green-50 text-green-700 border-green-200";
    case "LOGIN_FAILED":
    case "BOOK_DELETE":
      return "bg-red-50 text-red-700 border-red-200";
    case "BOOK_CREATE":
    case "BOOK_UPDATE":
    case "AUTHOR_CREATE":
    case "CATEGORY_CREATE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "RECOMMENDATION_REQUEST":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "LOGOUT":
    default:
      return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = new URL("/api/admin/audit-logs", window.location.origin);
    if (actionFilter) url.searchParams.set("action", actionFilter);

    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Logs de Auditoria</h1>
          <p className="text-sm text-neutral-500 mt-1">Histórico completo de ações de segurança e negócio.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="filter-select" className="text-xs font-bold uppercase tracking-wider text-neutral-400">Filtrar:</label>
          <select
            id="filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
          >
            <option value="">Todas as ações</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-4">Data e Hora</th>
                <th className="px-5 py-4">Ação</th>
                <th className="px-5 py-4">Usuário</th>
                <th className="px-5 py-4">Entidade</th>
                <th className="px-5 py-4">IP Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors duration-150">
                  <td className="px-5 py-4 whitespace-nowrap text-neutral-500 font-medium">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold leading-none ${getBadgeStyle(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {log.user ? (
                      <div className="leading-snug">
                        <p className="font-semibold text-neutral-800">{log.user.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-neutral-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-neutral-500">
                    {log.entity ? (
                      <span className="inline-flex items-center gap-1 font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md text-xs">
                        {log.entity} {log.entityId ? `#${log.entityId.slice(0, 6)}` : ""}
                      </span>
                    ) : (
                      <span className="text-neutral-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-neutral-500 font-mono text-xs">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-neutral-400">
            <svg className="h-5 w-5 animate-spin animate-infinite" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-medium">Carregando logs de auditoria...</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="py-12 text-center text-neutral-500">
            <span className="mx-auto block text-4xl mb-2">🛡️</span>
            <p className="font-semibold text-neutral-700">Nenhum log encontrado.</p>
            <p className="text-xs text-neutral-400 mt-1">Tente ajustar seus filtros.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
