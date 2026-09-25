"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

// Cliente: marca su ticket como solucionado y lo califica 1-5.
export default function ClientResolve({ ticketId, estado, rating }: {
  ticketId: string; estado: string; rating: number | null;
}) {
  const [msg, setMsg] = useState("");
  const [stars, setStars] = useState(rating ?? 0);
  if (estado === "cerrado") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#64748b]">Tu calificación:</span>
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} aria-label={`Calificar ${s}`} disabled={rating !== null}
            onClick={async () => {
              const supabase = createClient();
              const { error } = await supabase.from("tickets").update({ rating: s }).eq("id", ticketId);
              if (error) setMsg("Error: " + error.message);
              else setStars(s);
            }}
            className={s <= stars ? "text-amber-500" : "text-[#cbd5e1]"}>
            <Star size={18} fill="currentColor" aria-hidden="true" />
          </button>
        ))}
        {msg && <small> {msg}</small>}
      </div>
    );
  }
  return (
    <span>
      <Button
        variant="secondary"
        onClick={async () => {
          if (!confirm("¿Marcar este caso como solucionado?")) return;
          const supabase = createClient();
          const { error } = await supabase.from("tickets").update({
            estado: "cerrado", closed_at: new Date().toISOString(),
          }).eq("id", ticketId);
          setMsg(error ? "Error: " + error.message : "Cerrado. ¡Gracias! Recarga.");
        }}
      >Marcar como solucionado</Button>
      {msg && <small> {msg}</small>}
    </span>
  );
}
