import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import NewProjectForm from "./NewProjectForm";
import { ProjectsTable, TasksTable } from "./tables";
import { PageHeader } from "@/components/ui/page-header";

export default async function ProyectosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);
  const [{ data: projects }, { data: tasks }, { data: companies }] = await Promise.all([
    supabase.from("projects").select("id,nombre,estado,company_id").eq("organization_id", orgId).order("nombre"),
    supabase.from("tasks").select("id,titulo,estado,project_id").eq("organization_id", orgId).order("titulo").limit(100),
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId).is("deleted_at", null),
  ]);
  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Proyectos" subtitle={`${projects?.length ?? 0} proyectos · ${tasks?.length ?? 0} tareas`} />
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Proyectos</h2>
        <ProjectsTable rows={projects ?? []} />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Tareas</h2>
        <TasksTable rows={tasks ?? []} />
      </section>
      {write && <NewProjectForm orgId={orgId} companies={companies ?? []} />}
    </main>
  );
}
