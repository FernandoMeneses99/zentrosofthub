"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function TemplatesManager({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<{ id: string; titulo: string }[]>([]);
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("response_templates").select("id,titulo").eq("organization_id", orgId).order("titulo");
    setItems(data ?? []);
    setLoaded(true);
  };
  if (!loaded) load();

  return (
    <Card>
      <CardTitle>Plantillas de respuesta ({items.length})</CardTitle>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2">
            <span>{t.titulo}</span>
            <button
              aria-label={`Eliminar plantilla ${t.titulo}`}
              className="text-xs text-red-600 hover:underline"
              onClick={async () => {
                const supabase = createClient();
                const { error } = await supabase.from("response_templates").delete().eq("id", t.id);
                if (!error) setItems(items.filter((x) => x.id !== t.id));
              }}
            >Eliminar</button>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2">
        <input aria-label="Título de plantilla" placeholder="Título" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
          value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <textarea aria-label="Cuerpo de plantilla" placeholder="Cuerpo…" rows={2} className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
          value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
        <Button
          onClick={async () => {
            if (titulo.trim().length < 3 || cuerpo.trim().length < 3) { setMsg("Error: completa título y cuerpo."); return; }
            const supabase = createClient();
            const { data, error } = await supabase.from("response_templates").insert({
              organization_id: orgId, titulo: titulo.trim(), cuerpo: cuerpo.trim(),
            }).select("id,titulo").single();
            if (error) setMsg("Error: " + error.message);
            else { setItems([...items, data]); setTitulo(""); setCuerpo(""); setMsg(""); }
          }}
        >Guardar plantilla</Button>
      </div>
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </Card>
  );
}
