"use client";
import { useForm } from "@tanstack/react-form";
import { createClient } from "@/lib/supabase-client";
import { timeEntrySchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function NewTimeEntryForm({ orgId, companies, projects, tickets }: {
  orgId: string; companies: { id: string; razon_social: string }[]; projects: { id: string; nombre: string }[];
  tickets: { id: string; titulo: string }[];
}) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      inicio: "", fin: "", descripcion: "", company_id: "", project_id: "", ticket_id: "", billable: true as boolean,
    },
    onSubmit: async ({ value }) => {
      const parsed = timeEntrySchema.safeParse({ fecha: value.fecha, descripcion: value.descripcion });
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      if (value.inicio && value.fin && value.fin <= value.inicio) { setMsg("Error: la hora fin debe ser posterior al inicio."); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("time_entries").insert({
        organization_id: orgId, user_id: user?.id, company_id: value.company_id || null,
        project_id: value.project_id || null, ticket_id: value.ticket_id || null,
        fecha: value.fecha,
        started_at: value.inicio ? `${value.fecha}T${value.inicio}:00` : null,
        ended_at: value.fin ? `${value.fecha}T${value.fin}:00` : null,
        descripcion: value.descripcion, billable: value.billable,
      });
      setMsg(error ? "Error: " + error.message : "Hora registrada. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Registrar horas (manual)</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-3">
        <form.Field name="fecha">
          {(field) => (
            <input type="date" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
          )}
        </form.Field>
        <form.Field name="inicio">
          {(field) => (
            <input type="time" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
          )}
        </form.Field>
        <form.Field name="fin">
          {(field) => (
            <input type="time" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
          )}
        </form.Field>
        <form.Field name="descripcion">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 sm:col-span-2" placeholder="Descripción"
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
        <form.Field name="project_id">
          {(field) => (
            <select className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
              <option value="">Sin proyecto</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          )}
        </form.Field>
        <form.Field name="ticket_id">
          {(field) => (
            <select className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
              <option value="">Sin ticket</option>
              {tickets.map((t) => <option key={t.id} value={t.id}>{t.titulo.slice(0, 40)}</option>)}
            </select>
          )}
        </form.Field>
        <form.Field name="billable">
          {(field) => (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} />
              Facturable
            </label>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-3">
              {isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
