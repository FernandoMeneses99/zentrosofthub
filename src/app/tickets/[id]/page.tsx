import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import TicketComposer from "./TicketComposer";
import TicketStatusForm from "./TicketStatusForm";
import TicketAiSuggest from "./TicketAiSuggest";

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);

  const { data: ticket, error } = await supabase.from("tickets")
    .select("id,titulo,descripcion,estado,prioridad,sla_vence,created_at,company_id,asignado_a")
    .eq("id", id).eq("organization_id", orgId).single();
  if (error || !ticket)
    return <main className="space-y-4 p-8"><p>Ticket no encontrado o sin acceso.</p><Link href="/tickets">← Tickets</Link></main>;

  const [{ data: comments }, { data: companies }, { data: members }, { data: similares }] = await Promise.all([
    supabase.from("ticket_comments").select("id,cuerpo,es_interna,created_at,autor").eq("ticket_id", id).order("created_at"),
    supabase.from("companies").select("id,razon_social").eq("organization_id", orgId).is("deleted_at", null),
    supabase.from("organization_members").select("user_id").eq("org_id", orgId).eq("status", "active"),
    supabase.rpc("similar_tickets", { p_org: orgId, p_titulo: ticket.titulo, p_excluir: id }),
  ]);
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
            <TicketAiSuggest ticketId={id} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6">
        <div className="flex-1 space-y-4">
          <ol className="relative space-y-5 border-l-2 border-[#e6ebf2] pl-5">
            {(comments ?? []).map((c) => (
              <li key={c.id} className={`rounded-[12px] border p-4 ${c.es_interna ? "border-amber-200 bg-amber-50" : "border-[#e6ebf2] bg-white"}`}>
                <p className="text-xs text-[#64748b]">
                  {c.created_at.slice(0, 16).replace("T", " ")} · {c.es_interna ? "Nota interna" : "Respuesta"}
                </p>
                <p className="mt-1 text-sm">{c.cuerpo}</p>
              </li>
            ))}
            {(comments ?? []).length === 0 && <p className="text-sm text-[#64748b]">Sin mensajes todavía.</p>}
          </ol>
          {write && <TicketComposer ticketId={id} orgId={orgId} />}
          {(similares ?? []).length > 0 && (
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
          {write && <TicketStatusForm ticketId={id} estado={ticket.estado} prioridad={ticket.prioridad} asignado={ticket.asignado_a} members={(members ?? []).map((m) => m.user_id)} />}
        </aside>
      </div>
    </main>
  );
}
