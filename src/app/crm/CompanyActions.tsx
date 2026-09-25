"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Pencil, Ban } from "lucide-react";

export default function CompanyActions({ id, razon }: { id: string; razon: string }) {
  const [msg, setMsg] = useState("");
  return (
    <span className="flex gap-1">
      <Button
        variant="outline"
        aria-label={`Editar ${razon}`}
        onClick={async () => {
          const nuevo = prompt("Nuevo nombre comercial / razón social:", razon);
          if (!nuevo) return;
          const supabase = createClient();
          const { error } = await supabase.from("companies").update({ razon_social: nuevo }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Actualizada. Recarga.");
        }}
      ><Pencil size={14} aria-hidden="true" /></Button>
      <Button
        variant="outline"
        aria-label={`Desactivar ${razon}`}
        onClick={async () => {
          if (!confirm(`Desactivar ${razon}? (soft-delete)`)) return;
          const supabase = createClient();
          const { error } = await supabase.from("companies").update({ deleted_at: new Date().toISOString() }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Desactivada. Recarga.");
        }}
      ><Ban size={14} aria-hidden="true" /></Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
