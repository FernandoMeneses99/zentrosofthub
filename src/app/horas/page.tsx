import { createServerSupabase } from "@/lib/supabase-server";
import NewTimeEntryForm from "./NewTimeEntryForm";
import { HoursTable } from "./tables";
import Timer from "./Timer";
import { ExportCsv } from "@/components/ui/export-csv";
import { PageHeader } from "@/components/ui/page-header";

export default async function HorasPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main style={{ padding: 32 }}><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main style={{ padding: 32 }}><p>Sin organización.</p></main>;
  const [{ data: entries }, { data: companies }, { data: projects }, { data: tickets }] = await Promise.all([
    supabase.from("time_entries").select("id,fecha,descripcion,duration_min,billable,estado").eq("organization_id", orgId).order("fecha", { ascending: false }).limit(100),
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId).is("deleted_at", null),
    supabase.from("projects").select("id,nombre").eq("organization_id", orgId),
    supabase.from("tickets").select("id,titulo").eq("organization_id", orgId).in("estado", ["abierto", "en_proceso", "pendiente"]).order("created_at", { ascending: false }).limit(50),
  ]);
  const totalMin = entries?.reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0;
  const factMin = entries?.filter((e) => e.billable).reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0;
  const aprobMin = entries?.filter((e) => e.estado === "aprobado").reduce((a, e) => a + (e.duration_min ?? 0), 0) ?? 0;
  return (
    <main className="space-y-6 p-8">
      <PageHeader
        title="Horas"
        subtitle={`${(totalMin / 60).toFixed(1)}h totales · ${(factMin / 60).toFixed(1)}h facturables · ${(aprobMin / 60).toFixed(1)}h aprobadas`}
        action={<ExportCsv rows={(entries ?? []) as Record<string, unknown>[]} filename="horas.csv" label="Exportar CSV" />}
      />
      <Timer orgId={orgId} />
      <HoursTable rows={entries ?? []} />
      <NewTimeEntryForm orgId={orgId} companies={companies ?? []} projects={projects ?? []} tickets={tickets ?? []} />
    </main>
  );
}
