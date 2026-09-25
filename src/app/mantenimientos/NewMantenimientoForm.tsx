"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const schema = z.object({
  titulo: z.string().trim().min(3, "Mínimo 3 caracteres").max(200),
  descripcion: z.string().trim().max(2000).default(""),
  inicio: z.string().min(1, "Fecha requerida"),
  fin: z.string().default(""),
});

export default function NewMantenimientoForm({ orgId }: { orgId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { titulo: "", descripcion: "", inicio: "", fin: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { error } = await supabase.from("mantenimientos").insert({
        organization_id: orgId, titulo: value.titulo, descripcion: value.descripcion || null,
        inicio: new Date(value.inicio).toISOString(),
        fin: value.fin ? new Date(value.fin).toISOString() : null,
      });
      setMsg(error ? "Error: " + error.message : "Programado. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Programar mantenimiento</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-2">
        <form.Field name="titulo">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 sm:col-span-2" placeholder="Título" aria-label="Título"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="descripcion">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 sm:col-span-2" placeholder="Descripción" aria-label="Descripción"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="inicio">
          {(field) => (
            <label className="text-sm">Inicio
              <input type="datetime-local" aria-label="Inicio" className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
            </label>
          )}
        </form.Field>
        <form.Field name="fin">
          {(field) => (
            <label className="text-sm">Fin (opcional)
              <input type="datetime-local" aria-label="Fin" className="mt-1 w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
            </label>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-2">
              {isSubmitting ? "Guardando…" : "Programar"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
