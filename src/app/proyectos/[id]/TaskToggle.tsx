"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

const NEXT: Record<string, string> = { pendiente: "en_proceso", en_proceso: "hecha", hecha: "pendiente" };

export default function TaskToggle({ id, estado }: { id: string; estado: string }) {
  const [msg, setMsg] = useState("");
  return (
    <span>
      <button
        aria-label="Avanzar estado de la tarea"
        className="rounded-lg border border-[#e6ebf2] px-2 py-1 text-xs hover:border-[#bcd2ec]"
        onClick={async () => {
          const supabase = createClient();
          const { error } = await supabase.from("tasks").update({ estado: NEXT[estado] ?? "pendiente" }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Actualizada. Recarga.");
        }}
      >Avanzar</button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
