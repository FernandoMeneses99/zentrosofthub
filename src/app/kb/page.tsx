import { createServerSupabase } from "@/lib/supabase-server";
import { canWrite } from "@/lib/access";
import { Card, CardTitle, Badge } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import NewArticleForm from "./NewArticleForm";
import Link from "next/link";

export default async function KbPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: memberships } = await supabase.from("organization_members").select("org_id,tenant_role").eq("user_id", user.id);
  const orgId = memberships?.[0]?.org_id as string | undefined;
  if (!orgId) return <main className="p-8"><p>Sin organización.</p></main>;
  const write = canWrite(memberships?.[0]?.tenant_role);
  const q = ((await searchParams).q ?? "").trim();

  let query = supabase.from("kb_articles").select("id,titulo,tags,created_at").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(50);
  if (q) query = query.or(`titulo.ilike.%${q}%,contenido.ilike.%${q}%`);
  const { data: articles, error } = await query;

  if (error && /does not exist|could not find/i.test(error.message))
    return <main className="space-y-4 p-8"><h1 className="text-2xl font-extrabold">Conocimiento</h1><p>Falta aplicar <code>025_kb.sql</code>.</p></main>;

  return (
    <main className="space-y-6 p-8">
      <PageHeader title="Conocimiento" subtitle="Soluciones y procedimientos del equipo" />
      <form method="get" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar…" aria-label="Buscar artículos"
          className="flex-1 rounded-[10px] border border-[#e6ebf2] px-3 py-2" />
        <button className="rounded-[10px] bg-[#4b82c3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a6aa3]">Buscar</button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {(articles ?? []).map((a) => (
          <Card key={a.id}>
            <Link href={`/kb/${a.id}`} className="font-bold text-[#0a1628]">{a.titulo}</Link>
            <div className="mt-1 flex gap-1.5">
              {(a.tags ?? []).map((t: string) => <Badge key={t} tone="info">{t}</Badge>)}
            </div>
            <p className="mt-1 text-xs text-[#64748b]">{a.created_at.slice(0, 10)}</p>
          </Card>
        ))}
      </div>
      {(articles ?? []).length === 0 && <p className="text-sm text-[#64748b]">Sin artículos. Crea el primero abajo.</p>}
      {write && <NewArticleForm orgId={orgId} />}
    </main>
  );
}
