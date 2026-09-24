import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/health → verifica configuración SIN exponer secretos.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const configured = url.startsWith("https://") && anon.length > 20;
  let reachable: boolean | null = null;
  if (configured) {
    try {
      const r = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anon },
        signal: AbortSignal.timeout(8000),
      });
      reachable = r.ok;
    } catch {
      reachable = false;
    }
  }
  return NextResponse.json({
    ok: configured && reachable === true,
    env_configured: configured,
    supabase_reachable: reachable,
    region: "us-east-1",
  });
}
