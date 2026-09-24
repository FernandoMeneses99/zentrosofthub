"use client";
import { useForm } from "@tanstack/react-form";
import { createClient } from "@/lib/supabase-client";
import { companySchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

type Fields = {
  razon_social: string; nombre_comercial: string; nit: string; tipo: string;
  industria: string; direccion: string; ciudad: string; pais: string;
  telefono: string; email: string; website: string; notas: string;
};

const FIELDS: { name: keyof Fields; placeholder: string; span?: boolean }[] = [
  { name: "razon_social", placeholder: "Razón social *" },
  { name: "nombre_comercial", placeholder: "Nombre comercial" },
  { name: "nit", placeholder: "NIT" },
  { name: "tipo", placeholder: "Tipo de empresa" },
  { name: "industria", placeholder: "Industria" },
  { name: "direccion", placeholder: "Dirección", span: true },
  { name: "ciudad", placeholder: "Ciudad" },
  { name: "pais", placeholder: "País" },
  { name: "telefono", placeholder: "Teléfono" },
  { name: "email", placeholder: "Email" },
  { name: "website", placeholder: "Website" },
  { name: "notas", placeholder: "Notas", span: true },
];

export default function NewCompanyForm({ orgId }: { orgId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: Object.fromEntries(FIELDS.map((f) => [f.name, ""])) as Fields,
    onSubmit: async ({ value }) => {
      const parsed = companySchema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const nullify = (v: string) => (v === "" ? null : v);
      const { error } = await supabase.from("companies").insert({
        organization_id: orgId,
        razon_social: value.razon_social,
        nombre_comercial: nullify(value.nombre_comercial),
        nit: nullify(value.nit), tipo: nullify(value.tipo), industria: nullify(value.industria),
        direccion: nullify(value.direccion), ciudad: nullify(value.ciudad), pais: nullify(value.pais),
        telefono: nullify(value.telefono), email: nullify(value.email), website: nullify(value.website),
        notas: nullify(value.notas),
      });
      setMsg(error ? "Error: " + error.message : "Empresa creada. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Nueva empresa</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-3">
        {FIELDS.map(({ name, placeholder, span }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <input
                className={`rounded-[10px] border border-[#e6ebf2] px-3 py-2${span ? " sm:col-span-3" : ""}`}
                placeholder={placeholder} aria-label={placeholder}
                value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur}
              />
            )}
          </form.Field>
        ))}
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
