import { createServerSupabase } from "@/lib/supabase-server";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { HoursLine, HoursBars, BillablePie } from "@/components/charts";
import { Building2, Users, Clock, CircleCheck } from "lucide-react";

export default async function Dashboard() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: orgs } = await supabase.from("organizations").select("id,name,slug");
  const orgId = orgs?.[0]?.id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;

  const [{ count: nCompanies }, { count: nContacts }, { data: entries }, { data: companies }, { count: nVencidos }, { data: actividad }] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("organization_id", orgId).is("deleted_at", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).is("deleted_at", null),
    supabase.from("time_entries").select("fecha,duration_min,billable,estado,company_id").eq("organization_id", orgId).order("fecha", { ascending: true }).limit(200),
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId).is("deleted_at", null),
    supabase.from("tickets").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("estado", ["abierto", "en_proceso", "pendiente"]).lt("sla_vence", new Date().toISOString()),
    supabase.from("audit_logs").select("accion,recurso,at").eq("organization_id", orgId).order("at", { ascending: false }).limit(5),
  ]);

  const totalMin = entries?.reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0;
  const aprobMin = entries?.filter((e) => e.estado === "aprobado").reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0;
  const factMin = entries?.filter((e) => e.billable).reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0;

  const byDay = new Map<string, number>();
  entries?.forEach((e) => byDay.set(e.fecha, (byDay.get(e.fecha) ?? 0) + (e.duration_min ?? 0) / 60));
  const days = [...byDay.entries()].sort();
  const nameById = new Map((companies ?? []).map((c) => [c.id, c.razon_social]));
  const byClient = new Map<string, number>();
  entries?.forEach((e) => {
    const name = (e.company_id && nameById.get(e.company_id)) || "Sin cliente";
    byClient.set(name, (byClient.get(name) ?? 0) + (e.duration_min ?? 0) / 60);
  });
  const perClient = [...byClient.entries()].map(([name, horas]) => ({ name: name.slice(0, 18), horas: +horas.toFixed(1) }));
  const last7 = days.slice(-7).reduce((a, [, h]) => a + h, 0);
  const prev7 = days.slice(-14, -7).reduce((a, [, h]) => a + h, 0);
  const trend = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : last7 > 0 ? 100 : 0;
  const line = days.slice(-14).map(([fecha, horas]) => ({ fecha: fecha.slice(5), horas: +horas.toFixed(1) }));

  const kpis = [
    { label: "Empresas", value: nCompanies ?? 0, Icon: Building2 },
    { label: "Contactos", value: nContacts ?? 0, Icon: Users },
    { label: "Horas totales", value: (totalMin / 60).toFixed(1), Icon: Clock },
    { label: "Horas aprobadas", value: (aprobMin / 60).toFixed(1), Icon: CircleCheck },
  ];

  return (
    <main className="space-y-6 p-8">
      {(nVencidos ?? 0) > 0 && (
        <a href="/tickets" className="block rounded-[12px] border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          ⚠ {nVencidos} ticket(s) con SLA vencido — ver en Tickets
        </a>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1628]">{orgs?.[0]?.name}</h1>
          <p className="text-sm text-[#64748b]">{user.email} <Badge tone="ok">owner</Badge></p>
        </div>
        <Badge tone={trend >= 0 ? "ok" : "warn"}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs semana anterior</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, Icon }) => (
          <Card key={label} className="flex items-center gap-3">
            <span className="rounded-xl bg-[#4b82c3]/10 p-2.5 text-[#4b82c3]"><Icon size={20} /></span>
            <span>
              <span className="block text-2xl font-extrabold text-[#0a1628]">{value}</span>
              <CardTitle>{label}</CardTitle>
            </span>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Horas por día (14 días)</CardTitle>
          <HoursLine data={line} />
        </Card>
        <Card>
          <CardTitle>Facturable vs interna</CardTitle>
          <BillablePie data={[
            { name: "Facturable", value: +(factMin / 60).toFixed(1) },
            { name: "Interna", value: +((totalMin - factMin) / 60).toFixed(1) },
          ]} />
        </Card>
      </div>

      <Card>
        <CardTitle>Horas por estado</CardTitle>
        <HoursBars data={
          ["borrador", "enviado", "aprobado", "rechazado"].map((s) => ({
            name: s,
            horas: +((entries?.filter((e) => e.estado === s).reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0) / 60).toFixed(1),
          }))
        } />
      </Card>

      <Card>
        <CardTitle>Horas por cliente</CardTitle>
        <HoursBars data={perClient} />
      </Card>

      <Card>
        <CardTitle>Actividad reciente</CardTitle>
        <ul className="mt-2 space-y-1 text-sm">
          {(actividad ?? []).map((a, i) => (
            <li key={i} className="text-[#64748b]">{a.at.slice(0, 16).replace("T", " ")} — <strong className="text-[#0a1628]">{a.accion}</strong> {a.recurso}</li>
          ))}
          {(actividad ?? []).length === 0 && <li className="text-[#64748b]">Sin actividad registrada.</li>}
        </ul>
      </Card>
    </main>
  );
}
