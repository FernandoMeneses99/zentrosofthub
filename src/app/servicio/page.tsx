import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import { canOperate } from "@/lib/access";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ServiceArt, InboxEmpty } from "@/components/illustrations";
import { CircleCheck, Info } from "lucide-react";

const STAGES = [
  { key: "abierto", label: "Recibido" },
  { key: "pendiente", label: "En diagnóstico" },
  { key: "en_proceso", label: "En reparación" },
  { key: "cerrado", label: "Entregado" },
] as const;

export default async function ServicioPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const gestion = canOperate(memberships?.[0]?.tenant_role);

  let q = supabase.from("tickets").select("id,titulo,estado,prioridad,sla_vence,company_id")
    .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100);
  if (!gestion) q = q.eq("asignado_a", user.id);
  const { data: tickets } = await q;
  const { data: companies } = await supabase.from("companies").select("id,razon_social").eq("organization_id", orgId);
  const nameById = new Map((companies ?? []).map((c) => [c.id, c.razon_social]));

  const countBy = (estado: string) => (tickets ?? []).filter((t) => t.estado === estado).length;
  const total = tickets?.length ?? 0;
  const done = countBy("cerrado");

  return (
    <main className="space-y-6 p-8">
      <Breadcrumb items={[{ label: "Inicio", href: "/dashboard" }, { label: "Servicio" }]} />
      <h1 className="text-2xl font-extrabold text-[#0a1628]">Estado del servicio técnico</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <ol className="flex flex-col gap-3 rounded-[18px] border border-[#e6ebf2] bg-[#f8fafc] p-4 md:flex-row md:items-center lg:gap-4">
            {STAGES.map((s, i) => {
              const n = countBy(s.key);
              const reached = total > 0 && (n > 0 || done > 0);
              return (
                <li key={s.key} className="flex-1">
                  <Link href={`/tickets?estado=${s.key}`} className="flex items-center gap-2 rounded-lg p-1 hover:bg-white md:flex-col md:gap-1 md:text-center">
                    <span className={`grid size-8 place-content-center rounded-full ${reached ? "bg-[#4b82c3] text-white" : "bg-[#e6ebf2] text-[#64748b]"}`}>
                      {reached ? <CircleCheck size={16} aria-hidden="true" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </span>
                    <span className={`text-sm font-medium ${reached ? "text-[#0a1628]" : "text-[#64748b]"}`}>
                      {s.label} <span className="text-xs">({n})</span>
                    </span>
                  </Link>
                  {i < STAGES.length - 1 && <span className="hidden h-px w-8 bg-[#e6ebf2] md:block" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>

          <div className="flex gap-3 rounded-[12px] border border-[#bcd2ec] bg-[#4b82c3]/5 p-4 text-sm text-[#0a1628]" role="note">
            <Info size={17} className="mt-0.5 shrink-0 text-[#4b82c3]" aria-hidden="true" />
            <p>
              Así avanza tu servicio: <strong>Recibido → En diagnóstico → En reparación → Entregado</strong>.
              Te notificamos cada cambio de etapa. Si un caso supera su SLA lo verás marcado como vencido.
            </p>
          </div>

          <h2 className="text-lg font-bold text-[#0a1628]">
            {gestion ? "Casos de la organización" : "Mis casos asignados"} ({total})
          </h2>
          {total === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-[#bcd2ec] bg-white py-10">
              <InboxEmpty />
              <p className="text-sm text-[#64748b]">Sin casos en seguimiento.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#eef2f7] overflow-hidden rounded-[18px] border border-[#e6ebf2] bg-white text-sm">
              {(tickets ?? []).map((t) => {
                const stage = STAGES.findIndex((s) => s.key === t.estado);
                const venc = t.estado !== "cerrado" && t.sla_vence && new Date(t.sla_vence) < new Date();
                return (
                  <li key={t.id} className="space-y-1.5 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/tickets/${t.id}`} className="font-medium text-[#0a1628]">{t.titulo}</Link>
                      <span className="flex gap-1.5">
                        <Badge tone="info">{STAGES[stage]?.label ?? t.estado}</Badge>
                        {venc && <Badge tone="warn">vencido</Badge>}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#eef2f7]" role="progressbar"
                      aria-valuenow={((stage + 1) / STAGES.length) * 100} aria-valuemin={0} aria-valuemax={100}
                      aria-label={`Avance: ${STAGES[stage]?.label}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-[#4b82c3] to-[#4fd290]"
                        style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} />
                    </div>
                    <p className="text-xs text-[#64748b]">{t.company_id ? nameById.get(t.company_id) ?? "" : "Sin empresa"} · prioridad {t.prioridad}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-[18px] border border-[#e6ebf2] bg-white p-5 text-center">
          <ServiceArt />
          <p className="text-sm font-semibold text-[#0a1628]">Soporte Zentrosoft</p>
          <p className="text-xs text-[#64748b]">Respuesta según prioridad: urgente 4h · alta 24h · media 72h · baja 7 días.</p>
        </aside>
      </div>
    </main>
  );
}
