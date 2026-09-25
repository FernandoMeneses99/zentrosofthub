"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const PRIOS = ["urgente", "alta", "media", "baja"] as const;

export default function AjustesClient({ orgId, initial }: {
  orgId: string; initial: Record<string, number>;
}) {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(PRIOS.map((p) => [p, String(initial[p] ?? "")])),
  );
  const [msg, setMsg] = useState("");
  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Ajustes" subtitle="SLA por prioridad (horas). Vacío = valor por defecto." />
      <Card>
        <CardTitle>Tiempos de respuesta</CardTitle>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {PRIOS.map((p) => (
            <label key={p} className="text-sm font-medium">
              {p}
              <input
                type="number" min={1} aria-label={`Horas SLA ${p}`}
                className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                value={vals[p]} onChange={(e) => setVals({ ...vals, [p]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <Button
          className="mt-3"
          onClick={async () => {
            const supabase = createClient();
            const rows = PRIOS.filter((p) => vals[p] !== "").map((p) => ({
              organization_id: orgId, prioridad: p, horas: parseInt(vals[p], 10),
            }));
            if (rows.some((r) => !r.horas || r.horas < 1)) { setMsg("Error: horas inválidas."); return; }
            const { error } = await supabase.from("sla_policies").upsert(rows, { onConflict: "organization_id,prioridad" });
            setMsg(error ? "Error: " + error.message : "SLA guardado. Aplica a tickets nuevos.");
          }}
        >Guardar SLA</Button>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </Card>
    </main>
  );
}
