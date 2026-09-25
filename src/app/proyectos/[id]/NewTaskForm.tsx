"use client";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function NewTaskForm({ orgId, projectId }: { orgId: string; projectId: string }) {
  const [msg, setMsg] = useState("");
  const form = useForm({
    defaultValues: { titulo: "" },
    onSubmit: async ({ value }) => {
      const parsed = z.string().trim().min(3, "Mínimo 3 caracteres").max(200).safeParse(value.titulo);
      if (!parsed.success) { setMsg("Error: " + parsed.error.issues[0].message); return; }
      const supabase = createClient();
      const { error } = await supabase.from("tasks").insert({
        organization_id: orgId, project_id: projectId, titulo: value.titulo, estado: "pendiente",
      });
      setMsg(error ? "Error: " + error.message : "Tarea creada. Recarga.");
      if (!error) form.reset();
    },
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="flex gap-2">
      <form.Field name="titulo">
        {(field) => (
          <input className="flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2" placeholder="Nueva tarea" aria-label="Nueva tarea"
            value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
        )}
      </form.Field>
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>Agregar</Button>
        )}
      </form.Subscribe>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
