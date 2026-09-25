"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function ApiKeysManager({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<{ id: string; nombre: string; prefijo: string; created_at: string; revoked_at: string | null }[]>([]);
  const [nombre, setNombre] = useState("");
  const [nueva, setNueva] = useState("");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("api_keys").select("id,nombre,prefijo,created_at,revoked_at")
      .eq("organization_id", orgId).is("revoked_at", null).order("created_at", { ascending: false });
    setItems((data ?? []) as typeof items);
    setLoaded(true);
  };
  if (!loaded) load();

  return (
    <Card>
      <CardTitle>API keys ({items.length} activas)</CardTitle>
      <p className="mt-1 text-xs text-[#64748b]">
        Para integraciones (GitHub webhook: <code>/api/in/github?org={orgId}</code>).
        El valor se muestra una sola vez.
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-2">
            <span>{k.nombre} <code className="text-xs text-[#64748b]">{k.prefijo}…</code></span>
            <button
              aria-label={`Revocar ${k.nombre}`}
              className="text-xs text-red-600 hover:underline"
              onClick={async () => {
                if (!confirm(`¿Revocar ${k.nombre}?`)) return;
                const supabase = createClient();
                const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", k.id);
                if (!error) setItems(items.filter((x) => x.id !== k.id));
              }}
            >Revocar</button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input aria-label="Nombre de la key" placeholder="Ej: github-prod"
          className="flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
          value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Button
          onClick={async () => {
            const r = await fetch("/api/keys/crear", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nombre }),
            });
            const j = await r.json();
            if (!r.ok) setMsg("Error: " + j.error);
            else { setNueva(j.key); setNombre(""); setMsg(""); load(); }
          }}
        >Crear</Button>
      </div>
      {nueva && (
        <p className="mt-2 break-all rounded-lg bg-[#0a1628] p-3 text-xs text-green-300">
          Cópiala ahora (no se muestra de nuevo):<br />{nueva}
        </p>
      )}
      {msg && <p className="mt-1 text-xs text-red-700">{msg}</p>}
    </Card>
  );
}
