"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const schema = z.object({
  nombre: z.string().trim().min(3, "Mínimo 3 caracteres").max(200),
  company_id: z.string().default(""),
});

export default function NewProjectForm({ orgId, companies }: { orgId: string; companies: { id: string; razon_social: string }[] }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { nombre: "", company_id: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { error } = await supabase.from("projects").insert({
        organization_id: orgId, nombre: value.nombre, company_id: value.company_id || null,
      });
      setMsg(error ? "Error: " + error.message : "Proyecto creado. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Nuevo proyecto</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-2">
        <form.Field name="nombre">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder="Nombre del proyecto"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="company_id">
          {(field) => (
            <select className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
              <option value="">Sin cliente</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-2">
              {isSubmitting ? "Guardando…" : "Crear proyecto"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
