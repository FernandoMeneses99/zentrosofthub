"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BulkBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [estado, setEstado] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  if (ids.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-[#4b82c3]/30 bg-[#4b82c3]/5 p-3">
      <span className="text-sm font-semibold">{ids.length} seleccionados</span>
      <label className="sr-only" htmlFor="bulk-estado">Cambiar estado</label>
      <select id="bulk-estado" value={estado} onChange={(e) => setEstado(e.target.value)}
        className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm">
        <option value="">Estado…</option>
        {["abierto", "en_proceso", "pendiente", "resuelto", "cerrado"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <Button
        disabled={!estado || loading}
        onClick={async () => {
          setLoading(true);
          setMsg("");
          const r = await fetch("/api/tickets/masivo", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, patch: { estado } }),
          });
          const j = await r.json();
          setMsg(r.ok
            ? `Listo: ${j.ok} ok${j.errores.length ? `, ${j.errores.length} fallaron (${j.errores[0].error})` : ""}. Recarga.`
            : "Error: " + j.error);
          setLoading(false);
          if (r.ok && j.errores.length === 0) onDone();
        }}
      >{loading ? "Aplicando…" : "Aplicar"}</Button>
      {msg && <p className="w-full text-xs">{msg}</p>}
    </div>
  );
}
