import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Falta configuración Supabase en el servidor (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
      "Configúralas en Vercel → Settings → Environment Variables y redeploy.",
    );
  }
  const store = await cookies();
  return createServerClient(url, anon, { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
}
