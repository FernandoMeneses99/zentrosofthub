"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { User as UserIcon, ShieldCheck, Database } from "lucide-react";

export default function PerfilClient({ email, org, role, status, initial }: {
  email: string; org: string; role: string; status: string; initial: string;
}) {
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
    <main className="space-y-6 p-8">
      <PageHeader title="Perfil" subtitle="Tu identidad, acceso y derechos de datos (Ley 1581)" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-4">
          <span className="grid size-14 place-content-center rounded-2xl bg-gradient-to-br from-[#4b82c3] to-[#4fd290] text-2xl font-extrabold text-white" aria-hidden="true">
            {initial}
          </span>
          <span>
            <CardTitle><UserIcon size={13} className="mr-1 inline" />Identidad</CardTitle>
            <p className="font-semibold text-[#0a1628]">{email}</p>
          </span>
        </Card>
        <Card>
          <CardTitle><ShieldCheck size={13} className="mr-1 inline" />Acceso</CardTitle>
          <p className="mt-1 text-sm">Organización: <strong>{org}</strong></p>
          <p className="mt-1 text-sm">Rol: <Badge tone={role === "owner" ? "ok" : "info"}>{role}</Badge> <Badge tone={status === "active" ? "ok" : "warn"}>{status}</Badge></p>
        </Card>
        <Card>
          <CardTitle><Database size={13} className="mr-1 inline" />Mis datos</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportar}>Exportar JSON</Button>
            <Button variant="danger" onClick={solicitarBorrado}>Solicitar eliminación</Button>
          </div>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </Card>
      </div>
    </main>
  );
}
