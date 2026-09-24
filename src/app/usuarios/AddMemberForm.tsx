"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const schema = z.object({
  user_id: z.string().trim().uuid("UUID inválido"),
  tenant_role: z.enum(["owner", "admin", "manager", "employee", "viewer"]),
});

export default function AddMemberForm({ orgId }: { orgId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { user_id: "", tenant_role: "employee" as const },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { error } = await supabase.from("organization_members").insert({
        org_id: orgId, user_id: value.user_id, tenant_role: value.tenant_role, status: "active",
      });
      setMsg(error ? "Error: " + error.message : "Miembro agregado. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Agregar técnico (ya registrado en /login)</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-3">
        <form.Field name="user_id">
          {(field) => (
            <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 sm:col-span-2" placeholder="UUID del usuario (Auth → Users)"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="tenant_role">
          {(field) => (
            <select className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value as never)}>
              {["owner", "admin", "manager", "employee", "viewer"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-3">
              {isSubmitting ? "Guardando…" : "Agregar"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
