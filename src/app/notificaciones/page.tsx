import { createServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/access";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import TelegramButton from "./TelegramButton";
import Link from "next/link";

export default async function NotificacionesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const role = memberships?.[0]?.tenant_role;

  // Clientes: solo avances de SUS tickets (respuestas nuevas + cambios de etapa).
  if (role === "client") {
    const { data: mine } = await supabase.from("tickets").select("id,titulo,estado").order("created_at", { ascending: false });
    const ids = (mine ?? []).map((t) => t.id);
    const { data: avances } = ids.length
      ? await supabase.from("ticket_comments").select("id,cuerpo,created_at,ticket_id")
          .in("ticket_id", ids).order("created_at", { ascending: false }).limit(20)
      : { data: [] };
    const titleOf = (tid: string) => mine?.find((t) => t.id === tid)?.titulo ?? "Ticket";
    return (
      <main className="space-y-6 p-8">
        <PageHeader title="Avisos" subtitle="Avances de tus casos" />
        <Card>
          <CardTitle>Actividad reciente en tus tickets</CardTitle>
          <ul className="mt-2 space-y-2 text-sm">
            {(avances ?? []).map((a) => (
              <li key={a.id} className="text-[#64748b]">
                <Link href={`/tickets/${a.ticket_id}`}>{titleOf(a.ticket_id)}</Link>
                {" — "}{a.cuerpo.slice(0, 90)}{a.cuerpo.length > 90 ? "…" : ""}
                <span className="text-xs"> ({a.created_at.slice(0, 16).replace("T", " ")})</span>
              </li>
            ))}
            {(avances ?? []).length === 0 && <li className="text-[#64748b]">Sin novedades.</li>}
          </ul>
        </Card>
      </main>
    );
  }

  const [{ data: vencidos }, { data: pendientes }] = await Promise.all([
    supabase.from("tickets").select("id,titulo,prioridad,sla_vence").eq("organization_id", orgId)
      .in("estado", ["abierto", "en_proceso", "pendiente"]).lt("sla_vence", new Date().toISOString())
      .order("sla_vence").limit(20),
    supabase.from("time_entries").select("id,fecha,descripcion,duration_min").eq("organization_id", orgId)
      .neq("estado", "aprobado").order("fecha", { ascending: false }).limit(20),
  ]);

  return (
    <main className="space-y-6 p-8">
      <PageHeader
        title="Avisos"
        subtitle="Pendientes accionables de tu organización"
        action={isAdmin(memberships?.[0]?.tenant_role) ? <TelegramButton /> : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>SLA vencidos ({vencidos?.length ?? 0})</CardTitle>
          <ul className="mt-2 space-y-2 text-sm">
            {(vencidos ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <Link href={`/tickets/${t.id}`}>{t.titulo}</Link>
                <Badge tone="warn">{t.prioridad}</Badge>
              </li>
            ))}
            {(vencidos ?? []).length === 0 && <li className="text-[#64748b]">Sin vencidos. Buen trabajo.</li>}
          </ul>
        </Card>
        <Card>
          <CardTitle>Horas por aprobar ({pendientes?.length ?? 0})</CardTitle>
          <ul className="mt-2 space-y-2 text-sm">
            {(pendientes ?? []).map((h) => (
              <li key={h.id} className="text-[#64748b]">
                {h.fecha} — {h.descripcion ?? "sin descripción"} ({h.duration_min ?? 0} min) — <Link href="/horas">revisar</Link>
              </li>
            ))}
            {(pendientes ?? []).length === 0 && <li className="text-[#64748b]">Todo aprobado.</li>}
          </ul>
        </Card>
      </div>
    </main>
  );
}
