"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const PRIOS = ["urgente", "alta", "media", "baja"] as const;

export default function AjustesClient({ orgId, initial, telegram }: {
  orgId: string; initial: Record<string, number>;
  telegram: { bot_token: string; chat_id: string };
}) {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(PRIOS.map((p) => [p, String(initial[p] ?? "")])),
  );
  const [first, setFirst] = useState<Record<string, string>>(
    Object.fromEntries(PRIOS.map((p) => [p, String(initial[`primera_${p}`] ?? "")])),
  );
  const [msg, setMsg] = useState("");
  const [bot, setBot] = useState(telegram.bot_token);
  const [chat, setChat] = useState(telegram.chat_id);
  const [tgMsg, setTgMsg] = useState("");
  return (
    <>
      <PageHeader title="Ajustes" subtitle="SLA por prioridad (horas). Vacío = valor por defecto." />
      <Card>
        <CardTitle>Tiempos de respuesta</CardTitle>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {PRIOS.map((p) => (
            <label key={p} className="text-sm font-medium">
              Resolución {p}
              <input
                type="number" min={1} aria-label={`Horas SLA resolución ${p}`}
                className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                value={vals[p]} onChange={(e) => setVals({ ...vals, [p]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {PRIOS.map((p) => (
            <label key={`pr-${p}`} className="text-sm font-medium">
              1ª respuesta {p}
              <input
                type="number" min={1} aria-label={`Horas primera respuesta ${p}`}
                className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                value={first[p]} onChange={(e) => setFirst({ ...first, [p]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <Button
          className="mt-3"
          onClick={async () => {
            const supabase = createClient();
            const rows = PRIOS.flatMap((p) => {
              const h = vals[p] !== "" ? parseInt(vals[p], 10) : null;
              const ph = first[p] !== "" ? parseInt(first[p], 10) : null;
              if ((h !== null && h < 1) || (ph !== null && ph < 1)) return [];
              if (h === null && ph === null) return [];
              return [{ organization_id: orgId, prioridad: p, horas: h ?? 72, primera_horas: ph }];
            });
            const { error } = await supabase.from("sla_policies").upsert(rows, { onConflict: "organization_id,prioridad" });
            setMsg(error ? "Error: " + error.message : "SLA guardado. Aplica a tickets nuevos.");
          }}
        >Guardar SLA</Button>
        {msg && <p className="mt-2 text-sm">{msg}</p>}
      </Card>
      <Card>
        <CardTitle>Telegram — bot de avisos</CardTitle>
        <p className="mt-1 text-xs text-[#64748b]">
          1) Habla con @BotFather → /newbot → copia el token. 2) Crea un grupo con el bot,
          escribe algo y abre <code>https://api.telegram.org/botTOKEN/getUpdates</code> para ver el chat.id.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-sm font-medium">Bot token
            <input type="password" autoComplete="off" aria-label="Bot token"
              className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={bot} onChange={(e) => setBot(e.target.value)} placeholder="123456:ABC…" />
          </label>
          <label className="text-sm font-medium">Chat ID
            <input aria-label="Chat ID" className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={chat} onChange={(e) => setChat(e.target.value)} placeholder="-100123…" />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={async () => {
              const supabase = createClient();
              const { error } = await supabase.from("integraciones").upsert({
                organization_id: orgId, provider: "telegram",
                config: { bot_token: bot.trim(), chat_id: chat.trim() }, activo: true,
              }, { onConflict: "organization_id,provider" });
              setTgMsg(error ? "Error: " + error.message : "Telegram guardado.");
            }}
          >Guardar</Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const supabase = createClient();
              await supabase.from("integraciones").upsert({
                organization_id: orgId, provider: "telegram",
                config: { bot_token: bot.trim(), chat_id: chat.trim() }, activo: true,
              }, { onConflict: "organization_id,provider" });
              const r = await fetch("/api/avisos/telegram", { method: "POST" });
              const j = await r.json();
              setTgMsg(r.ok ? `Prueba enviada: ${j.vencidos} vencidos, ${j.porAprobar} por aprobar.` : "Error: " + j.error);
            }}
          >Guardar y probar envío</Button>
        </div>
        {tgMsg && <p className="mt-2 text-sm">{tgMsg}</p>}
      </Card>
    </>
  );
}
