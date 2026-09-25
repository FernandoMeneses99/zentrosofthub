import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HoursBars, BillablePie } from "@/components/charts";
import { InboxEmpty } from "@/components/illustrations";
import NewTicketForm from "./NewTicketForm";
import Link from "next/link";

const estadoTone: Record<string, "info" | "warn" | "ok" | "default"> = {
  abierto: "info", en_proceso: "info", pendiente: "warn", cerrado: "ok",
};
const prioTone: Record<string, "warn" | "default" | "info"> = {
  urgente: "warn", alta: "warn", media: "info", baja: "default",
};

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);
  const role = memberships?.[0]?.tenant_role as string | undefined;
  const canCreate = write || role === "client";

  const filtro = (await searchParams).estado ?? "todos";
  let tickets: { id: string; titulo: string; estado: string; prioridad: string; created_at: string; sla_vence: string | null }[] | null = null;
  let stats: { estado: string; prioridad: string; sla_vence: string | null }[] | null = null;
  let ticketsMissing = false;
  try {
    let q = supabase.from("tickets").select("id,titulo,estado,prioridad,created_at,sla_vence").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(50);
    if (filtro !== "todos") q = q.eq("estado", filtro);
    const res = await q;
    const resStats = await supabase.from("tickets").select("estado,prioridad,sla_vence").eq("organization_id", orgId).limit(500);
    if (res.error) {
      if (/does not exist|could not find/i.test(res.error.message)) ticketsMissing = true;
      else throw new Error(res.error.message);
    } else tickets = res.data;
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

  const estados = ["todos", "abierto", "en_proceso", "pendiente", "cerrado"];
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
            <InboxEmpty />
            <p className="text-sm text-[#64748b]">Sin tickets en esta cola. Crea el primero abajo.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-[#e6ebf2] bg-white">
            <table className="min-w-full divide-y divide-[#eef2f7] text-sm">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#64748b]">
                <tr><th className="px-4 py-3 text-left">Ticket</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-left">Prioridad</th><th className="px-4 py-3 text-left">SLA</th><th className="px-4 py-3 text-left">Creado</th></tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {tickets.map((t) => {
                  const vencido = t.estado !== "cerrado" && t.sla_vence && new Date(t.sla_vence) < new Date();
                  return (
                    <tr key={t.id} className="hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 font-medium text-[#0a1628]"><Link href={`/tickets/${t.id}`}>{t.titulo}</Link></td>
                      <td className="px-4 py-3"><Badge tone={estadoTone[t.estado] ?? "default"}>{t.estado}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={prioTone[t.prioridad] ?? "default"}>{t.prioridad}</Badge></td>
                      <td className="px-4 py-3">{vencido ? <Badge tone="warn">vencido</Badge> : <span className="text-[#64748b]">{t.sla_vence?.slice(0, 16).replace("T", " ") ?? "—"}</span>}</td>
                      <td className="px-4 py-3 text-[#64748b]">{t.created_at.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {canCreate && <NewTicketForm orgId={orgId} companies={companies ?? []} requireCompany={role === "client"} />}
        <Link href="/dashboard"><Button variant="ghost">← Dashboard</Button></Link>
      </div>
    </main>
  );
}
