import { createServerSupabase } from "@/lib/supabase-server";
import { DocumentsTable } from "./tables";
import UploadForm from "./UploadForm";

export default async function DocumentosPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;

  const { data: docs, error } = await supabase.from("documents")
    .select("id,nombre,categoria,mime,size_bytes,storage_path,created_at")
    .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(100);

  if (error && /does not exist|could not find/i.test(error.message))
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Documentos</h1><p>Falta aplicar <code>018_documents.sql</code> en SQL Editor.</p></main>;

  return (
    <main className="space-y-6 p-8">
      <h1 className="text-2xl font-extrabold text-[#0a1628]">Documentos — {docs?.length ?? 0}</h1>
      <DocumentsTable rows={docs ?? []} orgId={orgId} />
      <UploadForm orgId={orgId} />
    </main>
  );
}
