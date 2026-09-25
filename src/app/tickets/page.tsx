import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HoursBars, BillablePie } from "@/components/charts";
import NewTicketForm from "./NewTicketForm";
import TemplatesManager from "./TemplatesManager";
import SavedFilters from "./SavedFilters";
import TicketsTable from "./TicketsTable";
import Link from "next/link";

export default async function TicketsPage({ searchParams }: {
  searchParams: Promise<{ estado?: string; q?: string; categoria?: string; prioridad?: string; page?: string }>
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);
  const role = memberships?.[0]?.tenant_role as string | undefined;
  const canCreate = write || role === "client";
  let clientCompany: string | null = null;
  if (role === "client") {
    const { data: mine } = await supabase.from("contacts").select("company_id").eq("user_id", user.id).limit(1);
    clientCompany = mine?.[0]?.company_id ?? null;
  }

  const sp = await searchParams;
  const filtro = sp.estado ?? "todos";
  const qtext = (sp.q ?? "").trim();
  const catf = sp.categoria ?? "todas";
  const priof = sp.prioridad ?? "todas";
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const PAGE = 20;
  let tickets: { id: string; titulo: string; estado: string; prioridad: string; categoria: string | null; created_at: string; sla_vence: string | null }[] | null = null;
  let totalCount: number | null = null;
  let stats: { estado: string; prioridad: string; sla_vence: string | null }[] | null = null;
  let ticketsMissing = false;
  try {
    let q = supabase.from("tickets")
      .select("id,titulo,estado,prioridad,categoria,created_at,sla_vence", { count: "exact" })
      .eq("organization_id", orgId).order("created_at", { ascending: false })
      .range((pageNum - 1) * PAGE, pageNum * PAGE - 1);
    if (filtro !== "todos") q = q.eq("estado", filtro);
    if (catf !== "todas") q = q.eq("categoria", catf);
    if (priof !== "todas") q = q.eq("prioridad", priof);
    if (qtext) q = q.or(`titulo.ilike.%${qtext}%,descripcion.ilike.%${qtext}%`);
    const res = await q;
    const resStats = await supabase.from("tickets").select("estado,prioridad,sla_vence").eq("organization_id", orgId).limit(500);
    if (res.error) {
      if (/does not exist|could not find/i.test(res.error.message)) ticketsMissing = true;
      else throw new Error(res.error.message);
    } else { tickets = res.data; totalCount = res.count; }
    stats = resStats.data;
  } catch (e) {
    return (
      <main className="space-y-4 p-8">
        <h1 className="text-2xl font-extrabold text-[#0a1628]">Tickets</h1>
        <p className="text-sm text-red-700">Error: {(e as Error).message}</p>
      </main>
    );
  }
  const [{ data: companies }] = await Promise.all([
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId).is("deleted_at", null),
  ]);

  if (ticketsMissing)
    return (
      <main className="space-y-4 p-8">
        <h1 className="text-2xl font-extrabold text-[#0a1628]">Tickets</h1>
        <p>Falta aplicar <code>011_tickets.sql</code> en SQL Editor.</p>
      </main>
    );

  const estados = ["todos", "abierto", "en_proceso", "pendiente", "resuelto", "cerrado"];
  const now = new Date();
  const byEstado = ["abierto", "en_proceso", "pendiente", "cerrado"].map((s) => ({
    name: s.replace("_", " "), value: (stats ?? []).filter((t) => t.estado === s).length,
  }));
  const byPrio = ["urgente", "alta", "media", "baja"].map((p) => ({
    name: p, horas: (stats ?? []).filter((t) => t.prioridad === p).length,
  }));
  const abiertos = (stats ?? []).filter((t) => t.estado !== "cerrado");
  const vencidos = abiertos.filter((t) => t.sla_vence && new Date(t.sla_vence) < now).length;
  const cumplimiento = abiertos.length > 0 ? Math.round(((abiertos.length - vencidos) / abiertos.length) * 100) : 100;

  return (
    <main className="flex min-h-[calc(100vh-57px)]">
      {/* Rail de colas estilo HyperUI */}
      <nav className="hidden w-56 shrink-0 space-y-1 border-r border-[#e6ebf2] bg-white p-3 lg:block">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Colas</p>
        {estados.map((e) => (
          <Link
            key={e}
            href={`/tickets?estado=${e}`}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filtro === e ? "bg-[#4b82c3]/10 text-[#3a6aa3]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0a1628]"}`}
          >
            {e === "todos" ? "Todos" : e.replace("_", " ")}
            {filtro === e && <span className="rounded-full bg-white px-2 py-0.5 text-xs">{tickets?.length ?? 0}</span>}
          </Link>
        ))}
        <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Prioridad</p>
        {["urgente", "alta", "media", "baja"].map((p, i) => (
          <span key={p} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[#64748b]">
            <span className="size-2 rounded-full" style={{ background: ["#ef4444", "#f59e0b", "#4b82c3", "#94a3b8"][i] }} />
            {p}
          </span>
        ))}
      </nav>

      <div className="flex-1 space-y-4 p-6">
        <PageHeader
          title="Tickets"
          subtitle={`${abiertos.length} abiertos · ${vencidos} vencidos · cumplimiento SLA ${cumplimiento}%${filtro !== "todos" ? ` · filtro: ${filtro}` : ""}`}
        />

        <form method="get" className="flex flex-wrap gap-2 rounded-[18px] border border-[#e6ebf2] bg-white p-3">
          <input type="hidden" name="estado" value={filtro} />
          <label className="sr-only" htmlFor="tq">Buscar tickets</label>
          <input id="tq" name="q" defaultValue={qtext} placeholder="Buscar por título o descripción…"
            className="min-w-52 flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm" />
          <label className="sr-only" htmlFor="tcat">Categoría</label>
          <select id="tcat" name="categoria" defaultValue={catf} className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm">
            {["todas", "soporte", "incidencia", "solicitud", "mantenimiento", "otro"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="sr-only" htmlFor="tprio">Prioridad</label>
          <select id="tprio" name="prioridad" defaultValue={priof} className="rounded-[10px] border border-[#e6ebf2] px-3 py-2 text-sm">
            {["todas", "urgente", "alta", "media", "baja"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="rounded-[10px] bg-[#4b82c3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a6aa3]">Filtrar</button>
          {(qtext || catf !== "todas" || priof !== "todas") && (
            <Link href="/tickets" className="rounded-[10px] border border-[#e6ebf2] px-4 py-2 text-sm">Limpiar</Link>
          )}
        </form>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardTitle>Por estado</CardTitle>
            <BillablePie data={byEstado.filter((d) => d.value > 0).map((d) => ({ name: d.name, value: d.value }))} />
          </Card>
          <Card className="lg:col-span-2">
            <CardTitle>Por prioridad</CardTitle>
            <HoursBars data={byPrio} />
          </Card>
        </div>

        {(!tickets || tickets.length === 0) ? (
          <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-[#bcd2ec] bg-white py-12">
            <p className="text-sm text-[#64748b]">Sin tickets con estos filtros. Crea el primero abajo.</p>
          </div>
        ) : (
          <TicketsTable rows={tickets} canBulk={write} />
        )}
        {(() => {
          const total = totalCount ?? 0;
          const pages = Math.max(1, Math.ceil(total / PAGE));
          if (pages <= 1) return null;
          const href = (p: number) => {
            const s = new URLSearchParams({ estado: filtro, page: String(p) });
            if (qtext) s.set("q", qtext);
            if (catf !== "todas") s.set("categoria", catf);
            if (priof !== "todas") s.set("prioridad", priof);
            return `/tickets?${s.toString()}`;
          };
          return (
            <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
              <p className="text-[#64748b]">{total} tickets · página {pageNum} de {pages}</p>
              <div className="flex gap-2">
                {pageNum > 1 && <Link href={href(pageNum - 1)} className="rounded-lg border border-[#e6ebf2] bg-white px-3 py-1.5">← Anterior</Link>}
                {pageNum < pages && <Link href={href(pageNum + 1)} className="rounded-lg border border-[#e6ebf2] bg-white px-3 py-1.5">Siguiente →</Link>}
              </div>
            </nav>
          );
        })()}

        {canCreate && <NewTicketForm orgId={orgId} companies={companies ?? []} requireCompany={role === "client"} fixedCompanyId={clientCompany} />}
        {write && <TemplatesManager orgId={orgId} />}
        <SavedFilters orgId={orgId} />
        <p><Link href="/dashboard" className="text-sm">← Dashboard</Link></p>
      </div>
    </main>
  );
}
