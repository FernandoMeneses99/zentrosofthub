import { createServerSupabase } from "@/lib/supabase-server";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role,status").eq("user_id", user.id);
  const m = memberships?.[0];
  const { data: orgs } = m
    ? await supabase.from("organizations").select("name,slug").eq("id", m.org_id)
    : { data: null };
  return (
    <PerfilClient
      email={user.email}
      org={orgs?.[0]?.name ?? "—"}
      role={m?.tenant_role ?? "—"}
      status={m?.status ?? "—"}
      initial={user.email.charAt(0).toUpperCase()}
    />
  );
}
