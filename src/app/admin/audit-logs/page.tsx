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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Logs de auditoria</h1>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Todas as ações</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Ação</th>
              <th className="px-4 py-2">Usuário</th>
              <th className="px-4 py-2">Entidade</th>
              <th className="px-4 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-neutral-100">
                <td className="px-4 py-2 text-neutral-500">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2 font-medium">{log.action}</td>
                <td className="px-4 py-2">
                  {log.user ? `${log.user.name} (${log.user.email})` : "—"}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {log.entity ?? "—"} {log.entityId ? `#${log.entityId.slice(0, 6)}` : ""}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && logs.length === 0 && (
          <p className="p-4 text-neutral-500">Nenhum log encontrado.</p>
        )}
      </Card>
    </div>
  );
}
