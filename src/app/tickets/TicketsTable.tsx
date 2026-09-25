"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/card";
import { InboxEmpty } from "@/components/illustrations";
import BulkBar from "./BulkBar";

export type Row = {
  id: string; titulo: string; estado: string; prioridad: string;
  categoria: string | null; created_at: string; sla_vence: string | null;
  primera_respuesta_at: string | null; asignado: string;
};

function slaText(sla: string | null, estado: string): { text: string; late: boolean } {
  if (!sla) return { text: "—", late: false };
  const diff = new Date(sla).getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 36e5);
  const d = Math.floor(h / 24);
  const txt = d > 0 ? `${d}d ${h % 24}h` : `${h}h ${Math.floor((abs % 36e5) / 6e4)}m`;
  if (estado === "cerrado") return { text: "cerrado", late: false };
  return diff < 0 ? { text: `vencido ${txt}`, late: true } : { text: `vence ${txt}`, late: false };
}

const estadoTone: Record<string, "info" | "warn" | "ok" | "default"> = {
  abierto: "info", en_proceso: "info", pendiente: "warn", resuelto: "ok", cerrado: "ok",
};
const prioDot: Record<string, string> = {
  urgente: "#ef4444", alta: "#f59e0b", media: "#4b82c3", baja: "#94a3b8",
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
              <th scope="col" className="px-4 py-3 text-left">Responsable</th>
              <th scope="col" className="px-4 py-3 text-left">SLA</th>
              <th scope="col" className="px-4 py-3 text-left">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7]">
            {rows.map((t) => {
              const sla = slaText(t.sla_vence, t.estado);
              return (
                <tr key={t.id} className={`hover:bg-[#f8fafc] ${sla.late ? "bg-red-50/50" : ""}`}>
                  {canBulk && (
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Seleccionar ${t.titulo}`} checked={sel.includes(t.id)} onChange={() => toggle(t.id)} />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-[#0a1628]">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: prioDot[t.prioridad] ?? "#94a3b8" }} aria-hidden="true" />
                      <Link href={`/tickets/${t.id}`}>{t.titulo}</Link>
                    </span>
                    <span className="mt-0.5 block text-xs text-[#64748b]">{t.categoria ?? "—"}{!t.primera_respuesta_at && t.estado !== "cerrado" ? " · sin primera respuesta" : ""}</span>
                  </td>
                  <td className="px-4 py-3"><Badge tone={estadoTone[t.estado] ?? "default"}>{t.estado.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="grid size-6 shrink-0 place-content-center rounded-full bg-gradient-to-br from-[#4b82c3] to-[#4fd290] text-[10px] font-bold text-white" aria-hidden="true">
                        {t.asignado.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-xs">{t.asignado}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {sla.late
                      ? <Badge tone="warn">{sla.text}</Badge>
                      : <span className="text-[#64748b]">{sla.text}</span>}
                  </td>
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
