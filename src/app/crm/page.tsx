import { createServerSupabase } from "@/lib/supabase-server";
import NewCompanyForm from "./NewCompanyForm";
import NewContactForm from "./NewContactForm";
import { CompaniesTable, ContactsTable } from "./tables";

export default async function CrmPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main style={{ padding: 32 }}><a href="/login">Inicia sesión</a></main>;
  const { data: memberships, error: mErr } = await supabase.from("organization_members").select("org_id").eq("user_id", user.id);
  if (mErr) return <main style={{ padding: 32 }}><p>Error membresía: {mErr.message} (falta aplicar 005_member_rls.sql)</p></main>;
  const orgId = memberships?.[0]?.org_id;
  if (!orgId) return <main style={{ padding: 32 }}><p>Sin organización asignada.</p></main>;
  const [{ data: companies }, { data: contacts }] = await Promise.all([
    supabase.from("companies").select("id,razon_social,nit,estado,email,ciudad").eq("organization_id", orgId).is("deleted_at", null).order("razon_social"),
    supabase.from("contacts").select("id,nombre,apellido,email,rol_cliente,company_id").eq("organization_id", orgId).is("deleted_at", null).order("nombre"),
  ]);
  return (
    <main className="space-y-6 p-8">
      <h1 className="text-2xl font-extrabold text-[#0a1628]">CRM — {companies?.length ?? 0} empresas, {contacts?.length ?? 0} contactos</h1>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Empresas</h2>
        <CompaniesTable rows={companies ?? []} />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Contactos</h2>
        <ContactsTable rows={contacts ?? []} orgId={orgId} />
      </section>
      <NewCompanyForm orgId={orgId} />
      <NewContactForm orgId={orgId} companies={(companies ?? []).map((c) => ({ id: c.id, razon_social: c.razon_social }))} />
    </main>
  );
}
