import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite, canOperate } from "@/lib/access";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StageBadges, SERVICE_STAGES, stageOf } from "@/components/ui/service-stages";
import EditCompanyForm from "./EditCompanyForm";
import Link from "next/link";

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  if (!canOperate(memberships?.[0]?.tenant_role)) {
    return <main className="space-y-4 p-8"><p>Módulo no disponible para tu rol.</p><Link href="/dashboard">← Dashboard</Link></main>;
  }
  const write = canWrite(memberships?.[0]?.tenant_role);

  const { data: c, error } = await supabase.from("companies").select("*")
    .eq("id", id).eq("organization_id", orgId).is("deleted_at", null).single();
  if (error || !c)
    return <main className="space-y-4 p-8"><p>Empresa no encontrada o sin acceso.</p><Link href="/crm">← CRM</Link></main>;

  const [{ data: contacts }, { data: tickets }, { data: projects }, { data: hours }] = await Promise.all([
    supabase.from("contacts").select("id,nombre,apellido,cargo,rol_cliente,email").eq("company_id", id).is("deleted_at", null),
    supabase.from("tickets").select("id,titulo,estado,prioridad").eq("company_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("projects").select("id,nombre,estado").eq("company_id", id),
    supabase.from("time_entries").select("duration_min,billable").eq("company_id", id),
  ]);
  const totalH = ((hours ?? []).reduce((a, h) => a + (h.duration_min ?? 0), 0) / 60).toFixed(1);

  const facts: [string, string][] = [
    ["Nombre comercial", c.nombre_comercial ?? "—"], ["NIT", c.nit ?? "—"],
    ["Tipo", c.tipo ?? "—"], ["Industria", c.industria ?? "—"],
    ["Dirección", c.direccion ?? "—"], ["Ciudad", c.ciudad ?? "—"],
    ["País", c.pais ?? "—"], ["Teléfono", c.telefono ?? "—"],
    ["Email", c.email ?? "—"], ["Website", c.website ?? "—"],
  ];

  return (
    <main className="space-y-6 p-8">
      <Link href="/crm" className="text-sm">← CRM</Link>
      <PageHeader title={c.razon_social} subtitle={`${c.estado} · ${totalH}h registradas · NIT ${c.nit ?? "—"}`} />
      {write && <EditCompanyForm company={c} />}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Datos de la empresa</CardTitle>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {facts.map(([k, v]) => (
              <div key={k}><dt className="text-[#64748b]">{k}</dt><dd className="font-medium text-[#0a1628]">{v}</dd></div>
            ))}
          </dl>
          {c.notas && <p className="mt-3 text-sm text-[#64748b]">{c.notas}</p>}
        </Card>
        <Card>
          <CardTitle>Contactos ({contacts?.length ?? 0})</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {(contacts ?? []).map((x) => (
              <li key={x.id}>{x.nombre} {x.apellido ?? ""} <span className="text-[#64748b]">· {x.cargo ?? "—"} · </span><Badge tone="info">{x.rol_cliente}</Badge></li>
            ))}
            {(contacts ?? []).length === 0 && <li className="text-[#64748b]">Sin contactos.</li>}
          </ul>
        </Card>
        <Card>
          <CardTitle>Estado del servicio ({tickets?.length ?? 0})</CardTitle>
          <div className="mt-2"><StageBadges tickets={(tickets ?? []).map((t) => ({ estado: t.estado }))} /></div>
          <ul className="mt-2 space-y-1 text-sm">
            {(tickets ?? []).map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`}>{t.titulo}</Link>{" "}
                <Badge tone={t.estado === "cerrado" ? "ok" : "info"}>
                  {SERVICE_STAGES[stageOf(t.estado)]?.label ?? t.estado}
                </Badge>
              </li>
            ))}
            {(tickets ?? []).length === 0 && <li className="text-[#64748b]">Sin tickets.</li>}
          </ul>
        </Card>
        <Card>
          <CardTitle>Proyectos ({projects?.length ?? 0})</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {(projects ?? []).map((p) => (
              <li key={p.id}><Link href="/proyectos">{p.nombre}</Link> <Badge tone="ok">{p.estado}</Badge></li>
            ))}
            {(projects ?? []).length === 0 && <li className="text-[#64748b]">Sin proyectos.</li>}
          </ul>
        </Card>
      </div>
    </main>
  );
}
