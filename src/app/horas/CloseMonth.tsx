"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function CloseMonth({ orgId, locked }: { orgId: string; locked: string[] }) {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [msg, setMsg] = useState("");
  return (
    <Card>
      <CardTitle><Lock size={14} className="mr-1 inline" />Cierre mensual</CardTitle>
      <p className="mt-1 text-xs text-[#64748b]">
        Bloquea crear/editar/borrar horas del mes. Irreversible desde UI.
        {locked.length > 0 && <> Cerrados: {locked.map((m) => <Badge key={m} tone="default">{m}</Badge>)}</>}
      </p>
      <div className="mt-2 flex gap-2">
        <input type="month" aria-label="Mes a bloquear" value={mes} onChange={(e) => setMes(e.target.value)}
          className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm" />
        <Button
          onClick={async () => {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) { setMsg("Error: mes inválido."); return; }
            if (!confirm(`Bloquear ${mes}? No podrás modificar sus horas.`)) return;
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from("locked_months").insert({
              organization_id: orgId, mes, locked_by: user?.id,
            });
            setMsg(error ? "Error: " + error.message : `Mes ${mes} bloqueado. Recarga.`);
          }}
        >Bloquear mes</Button>
      </div>
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </Card>
  );
}
