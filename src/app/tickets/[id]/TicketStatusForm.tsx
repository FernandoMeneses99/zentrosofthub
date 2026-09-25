"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function TicketStatusForm({ ticketId, estado, prioridad, asignado, members }: {
  ticketId: string; estado: string; prioridad: string; asignado: string | null; members: { id: string; name: string }[];
}) {
  const [msg, setMsg] = useState("");
  const update = async (patch: Record<string, string | null>) => {
    const supabase = createClient();
    const { error } = await supabase.from("tickets").update({
      ...patch, closed_at: patch.estado === "cerrado" ? new Date().toISOString() : null,
    }).eq("id", ticketId);
    if (error) { setMsg("Error: " + error.message); return; }
    setMsg("Guardado. Recarga.");
    if (patch.estado) {
      fetch("/api/tickets/notificar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId }),
      }).catch(() => {});
    }
  };
  return (
    <div className="space-y-3 text-sm">
      <label className="block">Estado
        <select className="mt-1 w-full rounded-lg border border-[#e6ebf2] px-2 py-1.5" value={estado}
          onChange={(e) => update({ estado: e.target.value })}>
          {["abierto", "en_proceso", "pendiente", "resuelto", "cerrado"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="block">Prioridad
        <select className="mt-1 w-full rounded-lg border border-[#e6ebf2] px-2 py-1.5" value={prioridad}
          onChange={(e) => update({ prioridad: e.target.value })}>
          {["baja", "media", "alta", "urgente"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="block">Asignado
        <select className="mt-1 w-full rounded-lg border border-[#e6ebf2] px-2 py-1.5" value={asignado ?? ""}
          onChange={(e) => update({ asignado_a: e.target.value || null })}>
          <option value="">Sin asignar</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      {msg && <p className="text-xs">{msg}</p>}
    </div>
  );
}
