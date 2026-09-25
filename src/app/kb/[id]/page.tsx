import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="p-8"><a href="/login">Inicia sesión</a></main>;
  const { data: a, error } = await supabase.from("kb_articles")
    .select("id,titulo,contenido,tags,created_at").eq("id", id).single();
  if (error || !a)
    return <main className="space-y-4 p-8"><p>Artículo no encontrado o sin acceso.</p><Link href="/kb">← Conocimiento</Link></main>;
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <Link href="/kb" className="text-sm">← Conocimiento</Link>
      <h1 className="text-2xl font-extrabold text-[#0a1628]">{a.titulo}</h1>
      <p className="text-xs text-[#64748b]">{a.created_at.slice(0, 10)} · {(a.tags ?? []).join(", ")}</p>
      <p className="whitespace-pre-wrap text-[#334155]">{a.contenido}</p>
    </main>
  );
}
