import { createServerSupabase } from "@/lib/supabase-server";
import { canAudit } from "@/lib/access";
import { PageHeader } from "@/components/ui/page-header";

export default async function AuditoriaPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main style={{ padding: 32 }}><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("tenant_role").eq("user_id", user.id);
  if (!canAudit(memberships?.[0]?.tenant_role)) {
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Auditoría</h1><p>Requiere permiso audit.read (owner/admin).</p></main>;
  }
  const { data: logs, error } = await supabase.from("audit_logs").select("id,accion,recurso,recurso_id,resultado,at,actor,diff,hash").order("at", { ascending: false }).limit(100);
  return (
    <main className="space-y-4 p-8">
      <PageHeader title="Auditoría" subtitle="Últimos 100 eventos · cadena hash tamper-evident" />
      {error ? <p>Sin permiso o error: {error.message} (requiere audit.read)</p> : (
        <ul className="space-y-2">
          {logs?.map((l) => (
            <li key={l.id} className="rounded-[12px] border border-[#e6ebf2] bg-white px-4 py-2 text-sm">
              <span>{l.at} — <strong>{l.accion}</strong> {l.recurso} {l.recurso_id ?? ""} → {l.resultado ?? "ok"}</span>
              <details className="mt-1 text-xs text-[#64748b]">
                <summary className="cursor-pointer">Ver cambios{l.hash ? ` (${l.hash.slice(0, 8)})` : ""}</summary>
                <pre className="mt-1 overflow-x-auto rounded bg-[#f8fafc] p-2">{JSON.stringify(l.diff, null, 2)}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
