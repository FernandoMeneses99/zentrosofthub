import { createServerSupabase } from "@/lib/supabase-server";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return <main style={{ padding: 32 }}><a href="/login">Inicia sesión</a></main>;
  return <PerfilClient email={user.email} />;
}
