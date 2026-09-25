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

export default function NewTicketForm({ orgId, companies, requireCompany, fixedCompanyId }: {
  orgId: string; companies: { id: string; razon_social: string }[];
  requireCompany?: boolean; fixedCompanyId?: string | null;
}) {
  const [msg, setMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const form = useForm({
    defaultValues: { titulo: "", descripcion: "", prioridad: "media" as const, company_id: fixedCompanyId ?? "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      if (file && file.size > 10 * 1024 * 1024) { setMsg("Error: adjunto máximo 10 MB."); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Modo cliente sin vínculo previo: el servidor auto-vincula por email.
      if (requireCompany && !fixedCompanyId) {
        const r = await fetch("/api/tickets/crear", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: value.titulo, descripcion: value.descripcion, prioridad: value.prioridad }),
        });
        const j = await r.json();
        if (!r.ok) { setMsg("Error: " + j.error); return; }
        if (file) {
          const path = `org/${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { error: upErr } = await supabase.storage.from("documentos").upload(path, file);
          if (upErr) { setMsg("Ticket creado, pero falló el adjunto: " + upErr.message); return; }
          await supabase.from("documents").insert({
            organization_id: orgId, company_id: j.company_id, ticket_id: j.id,
            nombre: file.name, storage_path: path, mime: file.type || null,
            size_bytes: file.size, categoria: "evidencia",
          });
        }
        setMsg("Ticket creado. Recarga.");
        setFile(null);
        form.reset();
        return;
      }

      const companyId = fixedCompanyId ?? value.company_id;
      if (requireCompany && !companyId) { setMsg("Error: sin empresa asignada. Pide al owner que vincule tu contacto."); return; }
      const { data: ticket, error } = await supabase.from("tickets").insert({
        organization_id: orgId, titulo: value.titulo, descripcion: value.descripcion || null,
        prioridad: value.prioridad, company_id: companyId || null, created_by: user?.id,
      }).select("id").single();
      if (error) { setMsg("Error: " + error.message); return; }
      if (file && ticket) {
        const path = `org/${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("documentos").upload(path, file);
        if (upErr) { setMsg("Ticket creado, pero falló el adjunto: " + upErr.message); return; }
        await supabase.from("documents").insert({
          organization_id: orgId, company_id: companyId || null, ticket_id: ticket.id,
          nombre: file.name, storage_path: path, mime: file.type || null,
          size_bytes: file.size, categoria: "evidencia",
        });
      }
      setMsg("Ticket creado. Recarga.");
      setFile(null);
      form.reset();
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
            fixedCompanyId ? (
              <p className="rounded-[10px] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b]">
                Empresa: {companies.find((c) => c.id === fixedCompanyId)?.razon_social ?? "asignada"}
              </p>
            ) : (
              <select
                className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              >
                <option value="">Sin empresa</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            )
          )}
        </form.Field>
        <div>
          <label htmlFor="ticket-file" className="sr-only">Adjuntar evidencia (opcional, máx 10 MB)</label>
          <input id="ticket-file" type="file" aria-label="Adjuntar evidencia"
            className="w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
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
