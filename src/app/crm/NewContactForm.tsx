"use client";
import { useForm } from "@tanstack/react-form";
import { createClient } from "@/lib/supabase-client";
import { contactSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const ROLES = ["administrador","tecnico","finanzas","gerente","comercial","usuario_final","lectura"] as const;
const ESTADOS = ["activo", "inactivo", "potencial"] as const;

export default function NewContactForm({ orgId, companies }: { orgId: string; companies: { id: string; razon_social: string }[] }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: {
      nombre: "", apellido: "", email: "", telefono: "", cargo: "",
      estado: "activo" as (typeof ESTADOS)[number],
      notas: "", company_id: "", rol: "usuario_final" as (typeof ROLES)[number],
    },
    onSubmit: async ({ value }) => {
      const parsed = contactSchema.safeParse({
        nombre: value.nombre, apellido: value.apellido, email: value.email,
        telefono: value.telefono, cargo: value.cargo, estado: value.estado,
        notas: value.notas, rol_cliente: value.rol,
      });
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const nullify = (v: string) => (v === "" ? null : v);
      const { error } = await supabase.from("contacts").insert({
        organization_id: orgId, company_id: value.company_id || null,
        nombre: value.nombre, apellido: nullify(value.apellido), email: nullify(value.email),
        telefono: nullify(value.telefono), cargo: nullify(value.cargo), estado: value.estado,
        notas: nullify(value.notas), rol_cliente: value.rol,
      });
      setMsg(error ? "Error: " + error.message : "Contacto creado. Recarga.");
      if (!error) form.reset();
    },
  });
  const input = (name: "nombre" | "apellido" | "email" | "telefono" | "cargo" | "notas", placeholder: string) => (
    <form.Field key={name} name={name}>
      {(field) => (
        <input className="rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder={placeholder} aria-label={placeholder}
          value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
      )}
    </form.Field>
  );
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Nuevo contacto</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-3">
        {input("nombre", "Nombre *")}
        {input("apellido", "Apellido")}
        {input("email", "Email")}
        {input("telefono", "Teléfono")}
        {input("cargo", "Cargo")}
        <form.Field name="estado">
          {(field) => (
            <select aria-label="Estado" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value as never)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </form.Field>
        <form.Field name="company_id">
          {(field) => (
            <select aria-label="Empresa" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
              <option value="">Sin empresa</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          )}
        </form.Field>
        <form.Field name="rol">
          {(field) => (
            <select aria-label="Rol dentro del cliente" className="rounded-[10px] border border-[#e6ebf2] px-3 py-2"
              value={field.state.value} onChange={(e) => field.handleChange(e.target.value as never)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </form.Field>
        {input("notas", "Notas")}
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-3">
              {isSubmitting ? "Guardando…" : "Crear"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
