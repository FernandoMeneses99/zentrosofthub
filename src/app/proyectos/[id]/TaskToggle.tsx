"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const NEXT: Record<string, string> = { pendiente: "en_proceso", en_proceso: "hecha", hecha: "pendiente" };

export default function TaskToggle({ id, estado }: { id: string; estado: string }) {
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-1">
      <Button
        variant="outline" aria-label="Avanzar estado de la tarea"
        onClick={async () => {
          const supabase = createClient();
          const { error } = await supabase.from("tasks").update({ estado: NEXT[estado] ?? "pendiente" }).eq("id", id);
          setMsg(error ? "Error: " + error.message : "Actualizada. Recarga.");
        }}
      ><ArrowRight size={14} aria-hidden="true" /> Avanzar</Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
