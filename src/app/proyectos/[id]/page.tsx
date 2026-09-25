import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HoursBars } from "@/components/charts";
import NewTaskForm from "./NewTaskForm";
import TaskToggle from "./TaskToggle";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);

  const { data: project, error } = await supabase.from("projects")
    .select("id,nombre,estado,company_id,created_at").eq("id", id).eq("organization_id", orgId).single();
  if (error || !project)
    return <main className="space-y-4 p-8"><p>Proyecto no encontrado o sin acceso.</p><Link href="/proyectos">← Proyectos</Link></main>;

  const [{ data: tasks }, { data: hours }, { data: companies }] = await Promise.all([
    supabase.from("tasks").select("id,titulo,estado").eq("project_id", id).order("titulo"),
    supabase.from("time_entries").select("duration_min,billable,fecha").eq("project_id", id),
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId),
  ]);
  const totalH = ((hours ?? []).reduce((a, h) => a + (h.duration_min ?? 0), 0) / 60).toFixed(1);
  const done = (tasks ?? []).filter((t) => t.estado === "hecha").length;
  const total = tasks?.length ?? 0;
  const avance = total > 0 ? Math.round((done / total) * 100) : 0;
  const empresa = companies?.find((c) => c.id === project.company_id)?.razon_social ?? "—";

  const byDay = new Map<string, number>();
  (hours ?? []).forEach((h) => byDay.set(h.fecha, (byDay.get(h.fecha) ?? 0) + (h.duration_min ?? 0) / 60));
  const line = [...byDay.entries()].sort().slice(-14).map(([fecha, horas]) => ({ name: fecha.slice(5), horas: +horas.toFixed(1) }));

  return (
    <main className="space-y-6 p-8">
      <Link href="/proyectos" className="text-sm">← Proyectos</Link>
      <PageHeader title={project.nombre} subtitle={`${empresa} · ${totalH}h consumidas · avance ${avance}%`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Tareas ({done}/{total})</CardTitle>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f7]" role="progressbar"
            aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del proyecto">
            <div className="h-full rounded-full bg-gradient-to-r from-[#4b82c3] to-[#4fd290]" style={{ width: `${avance}%` }} />
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(tasks ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <span className={t.estado === "hecha" ? "text-[#64748b] line-through" : "text-[#0a1628]"}>{t.titulo}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={t.estado === "hecha" ? "ok" : "info"}>{t.estado}</Badge>
                  {write && <TaskToggle id={t.id} estado={t.estado} />}
                </span>
              </li>
            ))}
            {total === 0 && <li className="text-[#64748b]">Sin tareas.</li>}
          </ul>
          {write && <div className="mt-3"><NewTaskForm orgId={orgId} projectId={id} /></div>}
        </Card>
        <Card>
          <CardTitle>Horas del proyecto (14 días)</CardTitle>
          <HoursBars data={line} />
        </Card>
      </div>
    </main>
  );
}
