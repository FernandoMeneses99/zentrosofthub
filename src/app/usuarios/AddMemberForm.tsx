"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(200),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  tenant_role: z.enum(["owner", "admin", "manager", "employee", "viewer"]),
});

export default function AddMemberForm() {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { email: "", password: "", tenant_role: "employee" as const },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const r = await fetch("/api/usuarios/crear", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const j = await r.json();
      setMsg(r.ok ? `Cuenta creada (${j.user_id.slice(0, 8)}…). Comparte la contraseña por canal seguro.` : "Error: " + j.error);
      if (r.ok) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-1 font-bold text-[#0a1628]">Crear técnico con contraseña</h3>
      <p className="mb-3 text-xs text-[#64748b]">La cuenta queda activa de inmediato, sin gastar cuota de email.</p>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-3">
        <form.Field name="email">
          {(field) => (
            <input type="email" autoComplete="off" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder="Email del técnico" aria-label="Email del técnico"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <input type="password" autoComplete="new-password" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder="Contraseña inicial (8+)" aria-label="Contraseña inicial"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
          )}
        </form.Field>
        <form.Field name="tenant_role">
          {(field) => (
            <select aria-label="Rol" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value as never)}>
              {["owner", "admin", "manager", "employee", "viewer"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-3">
              {isSubmitting ? "Creando…" : "Crear cuenta"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
