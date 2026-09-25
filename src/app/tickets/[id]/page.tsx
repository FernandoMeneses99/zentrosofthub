import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite, canComment } from "@/lib/access";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TicketStatusForm from "./TicketStatusForm";
import TicketAiSuggest from "./TicketAiSuggest";
import Discussion from "./Discussion";
import ClientResolve from "./ClientResolve";
import GithubLinks from "./GithubLinks";
import Attachments from "./Attachments";
import { TicketStage } from "@/components/ui/service-stages";

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);
  const comment = canComment(memberships?.[0]?.tenant_role);
  const isClient = memberships?.[0]?.tenant_role === "client";

  const { data: ticket, error } = await supabase.from("tickets")
    .select("id,titulo,descripcion,estado,prioridad,sla_vence,created_at,company_id,asignado_a,rating,encuesta")
    .eq("id", id).eq("organization_id", orgId).single();
  if (error || !ticket)
    return <main className="space-y-4 p-8"><p>Ticket no encontrado o sin acceso.</p><Link href="/tickets">← Tickets</Link></main>;

  const [{ data: comments }, { data: companies }, { data: members }, { data: similares }, { data: profiles }] = await Promise.all([
    (isClient
      ? supabase.from("ticket_comments").select("id,cuerpo,es_interna,created_at,autor,autor_nombre").eq("ticket_id", id).eq("es_interna", false).order("created_at")
      : supabase.from("ticket_comments").select("id,cuerpo,es_interna,created_at,autor,autor_nombre").eq("ticket_id", id).order("created_at")),
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId).is("deleted_at", null),
    supabase.from("organization_members").select("user_id").eq("org_id", orgId).eq("status", "active"),
    supabase.rpc("similar_tickets", { p_org: orgId, p_titulo: ticket.titulo, p_excluir: id }),
    supabase.from("profiles").select("id,display_name"),
  ]);
  const nameOf = (uid: string | null, stored?: string | null) =>
    stored || (uid === user.id ? "Tú" : profiles?.find((p) => p.id === uid)?.display_name ?? "Usuario");
  const discussion = (comments ?? []).map((c) => ({ ...c, autor_nombre: nameOf(c.autor, c.autor_nombre) }));
  const { data: attachments } = await supabase.from("documents")
    .select("id,nombre,mime,storage_path").eq("ticket_id", id).order("created_at");
  const { data: links } = write
    ? await supabase.from("ticket_links").select("id,tipo,url,ref").eq("ticket_id", id).order("created_at")
    : { data: [] };
  const empresa = companies?.find((c) => c.id === ticket.company_id)?.razon_social ?? "—";

  return (
    <main className="flex min-h-[calc(100vh-57px)] flex-col">
      <div className="border-b border-[#e6ebf2] bg-white px-6 py-4">
        <Link href="/tickets" className="text-sm">← Tickets</Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[#64748b]">Ticket · {ticket.created_at.slice(0, 10)} · {empresa}</p>
            <h1 className="text-lg font-bold text-[#0a1628]">{ticket.titulo}</h1>
            {ticket.descripcion && <p className="mt-1 text-sm text-[#64748b]">{ticket.descripcion}</p>}
          </div>
          <div className="flex gap-2">
            <Badge tone="info">{ticket.estado}</Badge>
            <Badge tone={ticket.prioridad === "baja" ? "default" : "warn"}>{ticket.prioridad}</Badge>
            {isClient && <ClientResolve ticketId={id} estado={ticket.estado} rating={ticket.rating} encuesta={ticket.encuesta} />}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6">
        <div className="mx-auto w-full max-w-2xl flex-1 space-y-4">
          <div className="rounded-[18px] border border-[#e6ebf2] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#64748b]">Estado del servicio</h2>
            <TicketStage estado={ticket.estado} />
          </div>
          <Discussion ticketId={id} orgId={orgId} userId={user.id} initial={discussion} canWrite={comment} />
          <Attachments docs={attachments ?? []} />
          {write && <GithubLinks ticketId={id} orgId={orgId} initial={links ?? []} />}
          {!isClient && (similares ?? []).length > 0 && (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-800">Posibles duplicados</p>
              <ul className="mt-1 space-y-1">
                {(similares as { id: string; titulo: string; estado: string; sim: number }[]).map((s) => (
                  <li key={s.id}><Link href={`/tickets/${s.id}`}>{s.titulo}</Link> <span className="text-xs text-[#64748b]">({s.estado}, {(s.sim * 100).toFixed(0)}%)</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="hidden w-64 shrink-0 space-y-4 rounded-[18px] border border-[#e6ebf2] bg-white p-4 lg:block">
            {!isClient && <TicketAiSuggest ticketId={id} />}
            {write && <TicketStatusForm ticketId={id} estado={ticket.estado} prioridad={ticket.prioridad} asignado={ticket.asignado_a} members={(members ?? []).map((m) => ({ id: m.user_id, name: nameOf(m.user_id) }))} />}
        </aside>
      </div>
    </main>
  );
}
