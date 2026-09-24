"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function CompanyActions({ id, razon }: { id: string; razon: string }) {
  const [msg, setMsg] = useState("");
  const supabase = createClient();
  return (
    <span>
      {" "}
      <button
        onClick={async () => {
          const nuevo = prompt("Nuevo nombre comercial / razón social:", razon);
          if (!nuevo) return;
          const { error } = await supabase.from("companies").update({ razon_social: nuevo }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Actualizada. Recarga.");
        }}
      >Editar</button>
      <button
        onClick={async () => {
          if (!confirm(`Desactivar ${razon}? (soft-delete)`)) return;
          const { error } = await supabase.from("companies").update({ deleted_at: new Date().toISOString() }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Desactivada. Recarga.");
        }}
      >Desactivar</button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
