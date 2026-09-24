"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TicketAiSuggest({ ticketId }: { ticketId: string }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <span>
      <Button
        variant="secondary" disabled={loading}
        onClick={async () => {
          setLoading(true);
          setMsg("");
          try {
            const r = await fetch("/api/ai/suggest", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket_id: ticketId }),
            });
            const j = await r.json();
            setMsg(r.ok
              ? `IA sugiere: ${j.prioridad}${j.razones?.length ? ` (por: ${j.razones.join(", ")})` : ""} — revísala antes de aplicar.`
              : "Error: " + (j.error ?? "desconocido"));
          } catch {
            setMsg("Error de red.");
          }
          setLoading(false);
        }}
      >
        {loading ? "Analizando…" : "✨ Sugerir prioridad (IA)"}
      </Button>
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </span>
  );
}
