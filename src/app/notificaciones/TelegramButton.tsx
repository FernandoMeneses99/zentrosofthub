"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function TelegramButton() {
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
            const r = await fetch("/api/avisos/telegram", { method: "POST" });
            const j = await r.json();
            setMsg(r.ok ? `Enviado: ${j.vencidos} vencidos, ${j.porAprobar} por aprobar.` : "Error: " + j.error);
          } catch {
            setMsg("Error de red.");
          }
          setLoading(false);
        }}
      >
        <Send size={15} aria-hidden="true" /> {loading ? "Enviando…" : "Enviar resumen a Telegram"}
      </Button>
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </span>
  );
}
