import { createServerSupabase } from "@/lib/supabase-server";
import AddMemberForm from "./AddMemberForm";
import { MembersTable, type Member } from "./tables";
import { PageHeader } from "@/components/ui/page-header";

export default async function UsuariosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: mine } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = mine?.[0]?.org_id as string | undefined;
  const myRole = mine?.[0]?.tenant_role as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  if (!["owner", "admin"].includes(myRole ?? "")) return <main className="p-8"><p>Requiere rol owner/admin.</p></main>;

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id,tenant_role,status")
    .eq("org_id", orgId);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,display_name")
    .in("id", (members ?? []).map((m) => m.user_id));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const rows: Member[] = (members ?? []).map((m) => ({
    user_id: m.user_id, tenant_role: m.tenant_role, status: m.status,
    display_name: nameById.get(m.user_id) ?? m.user_id.slice(0, 8),
  }));

  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Usuarios" subtitle={`${rows.length} miembros del tenant · solo owner/admin`} />
      <MembersTable rows={rows} orgId={orgId} selfId={user.id} />
      <AddMemberForm />
      <p className="text-xs text-[#64748b]">
        Usuarios existentes (creados antes): asígnales contraseña con el SQL de reseteo en docs/RUNBOOK.md,
        o elimínalos de Auth y créalos aquí de nuevo.
      </p>
    </main>
  );
}
