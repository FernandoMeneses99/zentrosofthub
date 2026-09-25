"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SavedFilters({ orgId }: { orgId: string }) {
  const [items, setItems] = useState<{ id: string; nombre: string; filtros: Record<string, string> }[]>([]);
  const [nombre, setNombre] = useState("");
  const [loaded, setLoaded] = useState(false);
  const sp = useSearchParams();

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("saved_filters").select("id,nombre,filtros")
      .eq("organization_id", orgId).eq("user_id", user?.id ?? "").order("nombre");
    setItems((data ?? []) as typeof items);
    setLoaded(true);
  };
  if (!loaded) load();

  const toHref = (f: Record<string, string>) => {
    const s = new URLSearchParams({ estado: "todos", page: "1", ...f });
    return `/tickets?${s.toString()}`;
  };

  return (
    <Card>
      <CardTitle>Filtros guardados</CardTitle>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2">
            <Link href={toHref(f.filtros)}>{f.nombre}</Link>
            <button
              aria-label={`Eliminar filtro ${f.nombre}`}
              className="text-xs text-red-600 hover:underline"
              onClick={async () => {
                const supabase = createClient();
                const { error } = await supabase.from("saved_filters").delete().eq("id", f.id);
                if (!error) setItems(items.filter((x) => x.id !== f.id));
              }}
            >Eliminar</button>
          </li>
        ))}
        {items.length === 0 && <li className="text-[#64748b]">Sin filtros guardados.</li>}
      </ul>
      <div className="mt-3 flex gap-2">
        <input aria-label="Nombre del filtro" placeholder="Nombre del filtro actual"
          className="flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
          value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Button
          onClick={async () => {
            if (nombre.trim().length < 2) return;
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const filtros: Record<string, string> = {};
            for (const k of ["estado", "q", "categoria", "prioridad"]) {
              const v = sp.get(k);
              if (v) filtros[k] = v;
            }
            const { data, error } = await supabase.from("saved_filters").insert({
              organization_id: orgId, user_id: user?.id, nombre: nombre.trim(), filtros,
            }).select("id,nombre,filtros").single();
            if (!error && data) { setItems([...items, data]); setNombre(""); }
          }}
        >Guardar</Button>
      </div>
    </Card>
  );
}
