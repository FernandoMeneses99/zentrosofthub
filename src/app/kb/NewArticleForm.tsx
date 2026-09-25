"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const schema = z.object({
  titulo: z.string().trim().min(3, "Mínimo 3 caracteres").max(200),
  contenido: z.string().trim().min(10, "Mínimo 10 caracteres"),
  tags: z.string().trim().max(200).default(""),
});

export default function NewArticleForm({ orgId }: { orgId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { titulo: "", contenido: "", tags: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("kb_articles").insert({
        organization_id: orgId, titulo: value.titulo, contenido: value.contenido,
        tags: value.tags.split(",").map((t) => t.trim()).filter(Boolean),
        created_by: user?.id,
      });
      setMsg(error ? "Error: " + error.message : "Artículo creado. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Nuevo artículo</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2">
        <form.Field name="titulo">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder="Título" aria-label="Título"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="contenido">
          {(field) => (
            <textarea className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" rows={5} placeholder="Contenido (pasos de solución…)" aria-label="Contenido"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="tags">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder="Tags separados por coma" aria-label="Tags"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Guardando…" : "Crear artículo"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
