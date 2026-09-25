"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

// Cliente: marca su ticket como solucionado y lo califica 1-5 + comentario.
export default function ClientResolve({ ticketId, estado, rating, encuesta }: {
  ticketId: string; estado: string; rating: number | null; encuesta: string | null;
}) {
  const [msg, setMsg] = useState("");
  const [stars, setStars] = useState(rating ?? 0);
  const [comment, setComment] = useState(encuesta ?? "");
  const [sent, setSent] = useState(rating !== null);
  if (estado === "cerrado") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#64748b]">Tu calificación:</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} aria-label={`Calificar ${s}`} disabled={sent}
              onClick={() => setStars(s)}
              className={s <= stars ? "text-amber-500" : "text-[#cbd5e1]"}>
              <Star size={18} fill="currentColor" aria-hidden="true" />
            </button>
          ))}
        </div>
        {!sent && (
          <div className="flex gap-2">
            <input aria-label="Comentario de la encuesta" placeholder="¿Algo que debamos mejorar?"
              className="flex-1 rounded-lg border border-[#e6ebf2] px-2 py-1 text-xs"
              value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button
              onClick={async () => {
                if (stars < 1) { setMsg("Elige de 1 a 5 estrellas."); return; }
                const supabase = createClient();
                const { error } = await supabase.from("tickets").update({ rating: stars, encuesta: comment || null }).eq("id", ticketId);
                if (error) setMsg("Error: " + error.message);
                else { setSent(true); setMsg("¡Gracias por tu opinión!"); }
              }}
            >Enviar</Button>
          </div>
        )}
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
