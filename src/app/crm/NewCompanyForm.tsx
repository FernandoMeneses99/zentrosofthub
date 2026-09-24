"use client";
import { useForm } from "@tanstack/react-form";
import { createClient } from "@/lib/supabase-client";
import { companySchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function NewCompanyForm({ orgId }: { orgId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { razon_social: "", nit: "", email: "", telefono: "", ciudad: "" },
    onSubmit: async ({ value }) => {
      const parsed = companySchema.safeParse(value);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { error } = await supabase.from("companies").insert({
        organization_id: orgId, razon_social: value.razon_social, nit: value.nit || null,
        email: value.email || null, telefono: value.telefono || null, ciudad: value.ciudad || null,
      });
      setMsg(error ? "Error: " + error.message : "Empresa creada. Recarga.");
      if (!error) form.reset();
    },
  });
  const input = (name: "razon_social" | "nit" | "email" | "telefono" | "ciudad", placeholder: string) => (
    <form.Field key={name} name={name}>
      {(field) => (
        <div>
          <input
            className="w-full rounded-[10px] border border-[#e6ebf2] px-3 py-2"
            placeholder={placeholder}
            aria-label={placeholder}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
          {!field.state.meta.isValid && (
            <p className="text-xs text-red-600">{field.state.meta.errors.join(", ")}</p>
          )}
        </div>
      )}
    </form.Field>
  );
  return (
    <Card>
      <h3 className="mb-3 font-bold text-[#0a1628]">Nueva empresa</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="grid gap-2 sm:grid-cols-2">
        {input("razon_social", "Razón social")}
        {input("nit", "NIT")}
        {input("email", "Email")}
        {input("telefono", "Teléfono")}
        {input("ciudad", "Ciudad")}
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:col-span-2">
              {isSubmitting ? "Guardando…" : "Crear"}
            </Button>
          )}
        </form.Subscribe>
      </form>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  );
}
