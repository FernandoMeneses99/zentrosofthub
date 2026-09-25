import { createServerSupabase } from "@/lib/supabase-server";
import { canOperate } from "@/lib/access";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HoursBars, BillablePie } from "@/components/charts";
import { ExportCsv } from "@/components/ui/export-csv";

export default async function ReportesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  if (!canOperate(memberships?.[0]?.tenant_role)) {
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Reportes</h1><p>Módulo no disponible para tu rol.</p></main>;
  }

  const [{ data: hours }, { data: tickets }, { data: members }, { data: profiles }, { data: rated }, { data: openT }] = await Promise.all([
    supabase.from("time_entries").select("duration_min,billable,user_id,company_id").eq("organization_id", orgId).limit(1000),
    supabase.from("tickets").select("estado,prioridad,sla_vence").eq("organization_id", orgId).limit(1000),
    supabase.from("organization_members").select("user_id,tenant_role").eq("org_id", orgId).eq("status", "active"),
    supabase.from("profiles").select("id,display_name"),
    supabase.from("tickets").select("rating").eq("organization_id", orgId).not("rating", "is", null),
    supabase.from("tickets").select("asignado_a").eq("organization_id", orgId).neq("estado", "cerrado").limit(500),
  ]);
  const ratings = (rated ?? []).map((r) => r.rating as number);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "—";
  const nameOf = (uid: string) => profiles?.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);
  const h2h = (min: number) => +(min / 60).toFixed(1);

  const byTech = (members ?? []).map((m) => ({
    name: nameOf(m.user_id).slice(0, 18),
    horas: h2h((hours ?? []).filter((h) => h.user_id === m.user_id).reduce((a, h) => a + (h.duration_min ?? 0), 0)),
  })).filter((t) => t.horas > 0);

  const workload = new Map<string, number>();
  (openT ?? []).forEach((t) => {
    const k = t.asignado_a ? nameOf(t.asignado_a).slice(0, 18) : "Sin asignar";
    workload.set(k, (workload.get(k) ?? 0) + 1);
  });

  const now = new Date();
  const abiertos = (tickets ?? []).filter((t) => t.estado !== "cerrado");
  const vencidos = abiertos.filter((t) => t.sla_vence && new Date(t.sla_vence) < now).length;
  const cumplimiento = abiertos.length > 0 ? Math.round(((abiertos.length - vencidos) / abiertos.length) * 100) : 100;

  return (
    <main className="space-y-6 p-8">
      <PageHeader
        title="Reportes"
        subtitle={`Cumplimiento SLA ${cumplimiento}% · Satisfacción ${avgRating}/5 (${ratings.length} calificaciones) · ${(hours ?? []).length} registros`}
        action={<ExportCsv rows={(hours ?? []) as Record<string, unknown>[]} filename="reporte-horas.csv" label="Exportar CSV" />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Horas por técnico</CardTitle>
          <HoursBars data={byTech} />
        </Card>
        <Card>
          <CardTitle>Carga: abiertos por responsable</CardTitle>
          <HoursBars data={[...workload.entries()].map(([name, horas]) => ({ name, horas }))} />
        </Card>
        <Card>
          <CardTitle>SLA: al día vs vencidos</CardTitle>
          <BillablePie data={[
            { name: "Al día", value: abiertos.length - vencidos },
            { name: "Vencidos", value: vencidos },
          ]} />
        </Card>
      </div>
    </main>
  );
}
