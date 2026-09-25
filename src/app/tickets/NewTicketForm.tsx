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
  prioridad: z.enum(["baja", "media", "alta", "urgente"]),
  company_id: z.string().default(""),
});

export default function NewTicketForm({ orgId, companies, requireCompany }: {
  orgId: string; companies: { id: string; razon_social: string }[]; requireCompany?: boolean;
}) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { titulo: "", descripcion: "", prioridad: "media" as const, company_id: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      if (requireCompany && !value.company_id) { setMsg("Error: elige tu empresa."); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("tickets").insert({
        organization_id: orgId, titulo: value.titulo, descripcion: value.descripcion || null,
        prioridad: value.prioridad, company_id: value.company_id || null, created_by: user?.id,
      });
      setMsg(error ? "Error: " + error.message : "Ticket creado. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Nuevo ticket</h3>
      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="grid gap-2 sm:grid-cols-2"
      >
        <form.Field name="titulo">
          {(field) => (
            <input
              className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              placeholder="Título"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="prioridad">
          {(field) => (
            <select
              className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value as never)}
            >
              {["baja", "media", "alta", "urgente"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </form.Field>
        <form.Field name="company_id">
          {(field) => (
            <select
              className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option value="">Sin empresa</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          )}
        </form.Field>
        <form.Field name="descripcion">
          {(field) => (
            <input
              className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              placeholder="Descripción"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-2">
              {isSubmitting ? "Guardando…" : "Crear ticket"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
