"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export default function TimeEntryActions({ id, descripcion }: { id: string; descripcion: string | null }) {
  const [msg, setMsg] = useState("");
  return (
    <span className="flex gap-1">
      <Button
        variant="outline" aria-label="Editar descripción"
        onClick={async () => {
          const nueva = prompt("Editar descripción:", descripcion ?? "");
          if (nueva === null) return;
          if (nueva.trim().length < 3) { setMsg("Error: mínimo 3 caracteres."); return; }
          const supabase = createClient();
          const { error } = await supabase.from("time_entries").update({ descripcion: nueva }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Actualizada. Recarga.");
        }}
      ><Pencil size={14} aria-hidden="true" /></Button>
      <Button
        variant="outline" aria-label="Eliminar hora"
        onClick={async () => {
          if (!confirm("¿Eliminar esta hora? (solo borrador/enviado, no aprobadas)")) return;
          const supabase = createClient();
          const { error } = await supabase.from("time_entries").delete().eq("id", id).neq("estado", "aprobado");
          setMsg(error ? "Error: " + error.message : "Eliminada. Recarga.");
        }}
      ><Trash2 size={14} aria-hidden="true" /></Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
