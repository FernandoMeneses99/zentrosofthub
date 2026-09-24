"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const schema = z.object({
  cuerpo: z.string().trim().min(1, "Escribe un mensaje").max(5000),
  es_interna: z.boolean(),
});

export default function TicketComposer({ ticketId, orgId }: { ticketId: string; orgId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { cuerpo: "", es_interna: false as boolean },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("ticket_comments").insert({
        organization_id: orgId, ticket_id: ticketId, autor: user?.id,
        cuerpo: value.cuerpo, es_interna: value.es_interna,
      });
      setMsg(error ? "Error: " + error.message : "Publicado. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-2">
        <form.Field name="cuerpo">
          {(field) => (
            <textarea className="w-full resize-none rounded-[10px] border border-[#e6ebf2] px-3 py-2" rows={3}
              placeholder="Escribe una respuesta…"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <div className="flex items-center justify-between">
          <form.Field name="es_interna">
            {(field) => (
              <label className="flex items-center gap-2 text-xs text-[#64748b]">
                <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} />
                Nota interna (no visible al cliente)
              </label>
            )}
          </form.Field>
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Enviando…" : "Publicar"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
