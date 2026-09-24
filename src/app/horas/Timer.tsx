"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Timer({ orgId }: { orgId: string }) {
  const [running, setRunning] = useState<{ id: string; started: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - running.started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const start = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date();
    const { data, error } = await supabase.from("time_entries").insert({
      organization_id: orgId, user_id: user?.id,
      fecha: now.toISOString().slice(0, 10), started_at: now.toISOString(),
      descripcion: "Cronómetro en curso", estado: "borrador",
    }).select("id").single();
    if (error) { setMsg("Error: " + error.message); return; }
    setRunning({ id: data.id, started: Date.now() });
    setMsg("");
  };

  const stop = async () => {
    if (!running) return;
    const supabase = createClient();
    const { error } = await supabase.from("time_entries").update({
      ended_at: new Date().toISOString(), descripcion: `Cronómetro (${Math.floor(elapsed / 60)} min)`,
    }).eq("id", running.id);
    setMsg(error ? "Error: " + error.message : "Tiempo guardado. Recarga para verlo.");
    setRunning(null);
    setElapsed(0);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <Card className="flex items-center gap-4">
      <span className="text-3xl font-extrabold tabular-nums text-[#0a1628]">{mm}:{ss}</span>
      {!running
        ? <Button onClick={start}>▶ Iniciar</Button>
        : <Button onClick={stop} variant="secondary">⏸ Detener y guardar</Button>}
      {msg && <p className="text-sm">{msg}</p>}
    </Card>
  );
}
