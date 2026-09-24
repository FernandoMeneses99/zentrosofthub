import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import NewCompanyForm from "./NewCompanyForm";
import NewContactForm from "./NewContactForm";
import { CompaniesTable, ContactsTable } from "./tables";
import { ExportCsv } from "@/components/ui/export-csv";
import { PageHeader } from "@/components/ui/page-header";

export default async function CrmPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships, error: mErr } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  if (mErr) return <main style={{ padding: 32 }}><p>Error membresía: {mErr.message} (falta aplicar 005_member_rls.sql)</p></main>;
  const orgId = memberships?.[0]?.org_id;
  if (!orgId) return <main style={{ padding: 32 }}><p>Sin organización asignada.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);
  const [{ data: companies }, { data: contacts }] = await Promise.all([
    supabase.from("companies").select("id,razon_social,nit,estado,email,ciudad").eq("organization_id", orgId).is("deleted_at", null).order("razon_social"),
    supabase.from("contacts").select("id,nombre,apellido,email,rol_cliente,company_id").eq("organization_id", orgId).is("deleted_at", null).order("nombre"),
  ]);
  return (
    <main className="space-y-6 p-8">
      <PageHeader
        title="CRM"
        subtitle={`${companies?.length ?? 0} empresas · ${contacts?.length ?? 0} contactos`}
        action={
          <div className="flex gap-2">
            <ExportCsv rows={(companies ?? []) as Record<string, unknown>[]} filename="empresas.csv" label="Empresas CSV" />
            <ExportCsv rows={(contacts ?? []) as Record<string, unknown>[]} filename="contactos.csv" label="Contactos CSV" />
          </div>
        }
      />
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Empresas</h2>
        <CompaniesTable rows={companies ?? []} write={write} />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Contactos</h2>
        <ContactsTable rows={contacts ?? []} orgId={orgId} write={write} />
      </section>
      {write && <NewCompanyForm orgId={orgId} />}
      {write && <NewContactForm orgId={orgId} companies={(companies ?? []).map((c) => ({ id: c.id, razon_social: c.razon_social }))} />}
    </main>
  );
}
