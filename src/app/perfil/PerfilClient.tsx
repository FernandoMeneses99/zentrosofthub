"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function PerfilClient({ email }: { email: string }) {
  const [msg, setMsg] = useState("");
  const exportar = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: members }, { data: hours }] = await Promise.all([
      supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user?.id ?? ""),
      supabase.from("time_entries").select("id,fecha,descripcion,duration_min,billable,estado").eq("user_id", user?.id ?? ""),
    ]);
    const blob = new Blob([JSON.stringify({ email, members, hours }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mis-datos.json";
    a.click();
  };
  const solicitarBorrado = async () => {
    if (!confirm("¿Solicitar eliminación/anonimización de tus datos? Un administrador lo gestionará.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("security_events").insert({
      tipo: "solicitud_borrado_titular", severidad: "media",
      detalle: { email, solicitado_en: new Date().toISOString() },
    });
    setMsg(error ? "Error: " + error.message : "Solicitud registrada en security_events.");
  };
  return (
    <main style={{ padding: 32 }}>
      <h1>Mi perfil — Ley 1581</h1>
      <p>{email}</p>
      <button onClick={exportar}>Exportar mis datos (JSON)</button>{" "}
      <button onClick={solicitarBorrado}>Solicitar eliminación</button>
      <p>{msg}</p>
      <p><a href="/dashboard">Volver</a></p>
    </main>
  );
}
