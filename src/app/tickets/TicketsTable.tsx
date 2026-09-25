"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { InboxEmpty } from "@/components/illustrations";
import BulkBar from "./BulkBar";

export type Row = {
  id: string; titulo: string; estado: string; prioridad: string;
  categoria: string | null; created_at: string; sla_vence: string | null;
};

const estadoTone: Record<string, "info" | "warn" | "ok" | "default"> = {
  abierto: "info", en_proceso: "info", pendiente: "warn", resuelto: "ok", cerrado: "ok",
};
const prioTone: Record<string, "warn" | "default" | "info"> = {
  urgente: "warn", alta: "warn", media: "info", baja: "default",
};

export default function TicketsTable({ rows, canBulk }: { rows: Row[]; canBulk: boolean }) {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-[#bcd2ec] bg-white py-12">
        <InboxEmpty />
        <p className="text-sm text-[#64748b]">Sin tickets con estos filtros. Crea el primero abajo.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {canBulk && <BulkBar ids={sel} onDone={() => setSel([])} />}
      <div className="overflow-hidden rounded-[18px] border border-[#e6ebf2] bg-white">
        <table className="min-w-full divide-y divide-[#eef2f7] text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#64748b]">
            <tr>
              {canBulk && <th className="px-4 py-3"><span className="sr-only">Seleccionar</span></th>}
              <th scope="col" className="px-4 py-3 text-left">Ticket</th>
              <th scope="col" className="px-4 py-3 text-left">Estado</th>
              <th scope="col" className="px-4 py-3 text-left">Prioridad</th>
              <th scope="col" className="px-4 py-3 text-left">SLA</th>
              <th scope="col" className="px-4 py-3 text-left">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7]">
            {rows.map((t) => {
              const vencido = t.estado !== "cerrado" && t.sla_vence && new Date(t.sla_vence) < new Date();
              return (
                <tr key={t.id} className="hover:bg-[#f8fafc]">
                  {canBulk && (
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Seleccionar ${t.titulo}`} checked={sel.includes(t.id)} onChange={() => toggle(t.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-[#0a1628]"><Link href={`/tickets/${t.id}`}>{t.titulo}</Link></td>
                  <td className="px-4 py-3"><Badge tone={estadoTone[t.estado] ?? "default"}>{t.estado}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={prioTone[t.prioridad] ?? "default"}>{t.prioridad}</Badge></td>
                  <td className="px-4 py-3">{vencido ? <Badge tone="warn">vencido</Badge> : <span className="text-[#64748b]">{t.sla_vence?.slice(0, 16).replace("T", " ") ?? "—"}</span>}</td>
                  <td className="px-4 py-3 text-[#64748b]">{t.created_at.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
