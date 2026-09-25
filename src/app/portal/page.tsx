import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StageBadges } from "@/components/ui/service-stages";
import { Files, Inbox, Wrench, Clock, Megaphone } from "lucide-react";

// Portal del cliente: solo datos de su(s) empresa(s) (RLS 026 lo garantiza).
export default async function PortalPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const role = memberships?.[0]?.tenant_role;
  if (role !== "client") {
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Portal</h1><p>Solo disponible para cuentas de cliente.</p></main>;
  }

  const [{ data: companies }, { data: tickets }, { data: docs }, { data: hours }, { data: anuncios }] = await Promise.all([
    supabase.from("companies").select("id,razon_social,nombre_comercial,estado").is("deleted_at", null),
    supabase.from("tickets").select("id,titulo,estado,prioridad,sla_vence").order("created_at", { ascending: false }).limit(20),
    supabase.from("documents").select("id,nombre,categoria,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("time_entries").select("duration_min").limit(1000),
    supabase.from("kb_articles").select("id,titulo,created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const horasPlan = ((hours ?? []).reduce((a, h) => a + (h.duration_min ?? 0), 0) / 60).toFixed(1);
  const now = new Date();
  const abiertos = (tickets ?? []).filter((t) => t.estado !== "cerrado");
  const vencidos = abiertos.filter((t) => t.sla_vence && new Date(t.sla_vence) < now).length;

  return (
    <main className="space-y-6 p-8">
      <PageHeader
        title={`Hola, ${companies?.[0]?.nombre_comercial || companies?.[0]?.razon_social || "cliente"}`}
        subtitle="Estado de tu servicio de soporte · incluido en tu plan anual"
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-[#4b82c3]/10 p-2.5 text-[#4b82c3]"><Inbox size={20} aria-hidden="true" /></span>
          <span><span className="block text-2xl font-extrabold">{abiertos.length}</span><CardTitle>Casos abiertos</CardTitle></span>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700"><Wrench size={20} aria-hidden="true" /></span>
          <span><span className="block text-2xl font-extrabold">{vencidos}</span><CardTitle>Vencidos</CardTitle></span>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-[#4fd290]/15 p-2.5 text-[#14532d]"><Files size={20} aria-hidden="true" /></span>
          <span><span className="block text-2xl font-extrabold">{docs?.length ?? 0}</span><CardTitle>Documentos</CardTitle></span>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-violet-100 p-2.5 text-violet-700"><Clock size={20} aria-hidden="true" /></span>
          <span><span className="block text-2xl font-extrabold">{horasPlan}h</span><CardTitle>Horas consumidas</CardTitle></span>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Mis casos</CardTitle>
          <ul className="mt-2 space-y-2 text-sm">
            {(tickets ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <span className="font-medium">{t.titulo}</span>
                <Badge tone={t.estado === "cerrado" ? "ok" : "info"}>{t.estado.replace("_", " ")}</Badge>
              </li>
            ))}
            {(tickets ?? []).length === 0 && <li className="text-[#64748b]">Sin casos.</li>}
          </ul>
        </Card>
        <Card>
          <CardTitle>Mis documentos</CardTitle>
          <ul className="mt-2 space-y-2 text-sm">
            {(docs ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <span>{d.nombre}</span>
                <Badge tone="info">{d.categoria}</Badge>
              </li>
            ))}
            {(docs ?? []).length === 0 && <li className="text-[#64748b]">Sin documentos.</li>}
          </ul>
        </Card>
      </div>
      <Card>
        <CardTitle><Megaphone size={14} className="mr-1 inline" />Anuncios</CardTitle>
        <ul className="mt-2 space-y-1 text-sm">
          {(anuncios ?? []).map((a) => (
            <li key={a.id}>{a.titulo} <span className="text-xs text-[#64748b]">({a.created_at.slice(0, 10)})</span></li>
          ))}
          {(anuncios ?? []).length === 0 && <li className="text-[#64748b]">Sin anuncios.</li>}
        </ul>
      </Card>
      <Card>
        <CardTitle>Estado del servicio</CardTitle>
        <div className="mt-2"><StageBadges tickets={(tickets ?? []).map((t) => ({ estado: t.estado }))} /></div>
        <p className="mt-2 text-sm text-[#64748b]">
          Ver detalle en <Link href="/servicio">Servicio</Link> · tus tickets en <Link href="/tickets">Tickets</Link>.
        </p>
      </Card>
    </main>
  );
}
