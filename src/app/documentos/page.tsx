import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite, canOperate } from "@/lib/access";
import { DocumentsTable } from "./tables";
import UploadForm from "./UploadForm";
import { PageHeader } from "@/components/ui/page-header";

export default async function DocumentosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  if (!canOperate(memberships?.[0]?.tenant_role)) {
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Documentos</h1><p>Módulo no disponible para tu rol.</p></main>;
  }
  const write = canWrite(memberships?.[0]?.tenant_role);

  const { data: docs, error } = await supabase.from("documents")
    .select("id,nombre,categoria,mime,size_bytes,storage_path,created_at")
    .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100);

  if (error && /does not exist|could not find/i.test(error.message))
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Documentos</h1><p>Falta aplicar <code>018_documents.sql</code> en SQL Editor.</p></main>;

  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Documentos" subtitle={`${docs?.length ?? 0} archivos · bucket privado con URLs firmadas de 60s`} />
      <DocumentsTable rows={docs ?? []} orgId={orgId} write={write} />
      {write && <UploadForm orgId={orgId} />}
    </main>
  );
}
