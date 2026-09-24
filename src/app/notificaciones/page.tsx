import { createServerSupabase } from "@/lib/supabase-server";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";

export default async function NotificacionesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;

  const [{ data: vencidos }, { data: pendientes }] = await Promise.all([
    supabase.from("tickets").select("id,titulo,prioridad,sla_vence").eq("organization_id", orgId)
      .in("estado", ["abierto", "en_proceso", "pendiente"]).lt("sla_vence", new Date().toISOString())
      .order("sla_vence").limit(20),
    supabase.from("time_entries").select("id,fecha,descripcion,duration_min").eq("organization_id", orgId)
      .neq("estado", "aprobado").order("fecha", { ascending: false }).limit(20),
  ]);

  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Avisos" subtitle="Pendientes accionables de tu organización" />
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
