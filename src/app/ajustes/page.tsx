import { createServerSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/access";
import AjustesClient from "./AjustesClient";

export default async function AjustesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  if (!isAdmin(memberships?.[0]?.tenant_role)) {
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Ajustes</h1><p>Solo owner/admin.</p></main>;
  }
  const { data: pols } = await supabase.from("sla_policies").select("prioridad,horas").eq("organization_id", orgId);
  const initial: Record<string, number> = {};
  (pols ?? []).forEach((p) => { initial[p.prioridad] = p.horas; });
  const { data: integ } = await supabase.from("integraciones").select("config").eq("organization_id", orgId).eq("provider", "telegram").single();
  const cfg = (integ?.config ?? {}) as { bot_token?: string; chat_id?: string };
  return <AjustesClient orgId={orgId} initial={initial} telegram={{ bot_token: cfg.bot_token ?? "", chat_id: cfg.chat_id ?? "" }} />;
}
