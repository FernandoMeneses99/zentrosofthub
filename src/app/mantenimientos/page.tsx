import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import NewMantenimientoForm from "./NewMantenimientoForm";
import { CalendarClock } from "lucide-react";

export default async function MantenimientosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);

  const { data: items, error } = await supabase.from("mantenimientos")
    .select("id,titulo,descripcion,inicio,fin").eq("organization_id", orgId)
    .order("inicio", { ascending: false }).limit(30);

  if (error && /does not exist|could not find/i.test(error.message))
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Mantenimientos</h1><p>Falta aplicar <code>034_cliente_plus.sql</code>.</p></main>;

  const now = new Date();
  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Mantenimientos" subtitle="Ventanas programadas de servicio" />
      <div className="grid gap-4 lg:grid-cols-2">
        {(items ?? []).map((m) => {
          const active = new Date(m.inicio) <= now && (!m.fin || new Date(m.fin) >= now);
          return (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <CardTitle><CalendarClock size={14} className="mr-1 inline" />{m.titulo}</CardTitle>
                {active && <Badge tone="warn">en curso</Badge>}
              </div>
              {m.descripcion && <p className="mt-1 text-sm text-[#64748b]">{m.descripcion}</p>}
              <p className="mt-1 text-xs text-[#64748b]">
                {m.inicio.slice(0, 16).replace("T", " ")} → {m.fin ? m.fin.slice(0, 16).replace("T", " ") : "—"}
              </p>
            </Card>
          );
        })}
      </div>
      {(items ?? []).length === 0 && <p className="text-sm text-[#64748b]">Sin mantenimientos programados.</p>}
      {write && <NewMantenimientoForm orgId={orgId} />}
    </main>
  );
}
