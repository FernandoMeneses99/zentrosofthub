import { createClient } from "@supabase/supabase-js";

// Valida Authorization: Bearer <key> contra api_keys (compara hash SHA256).
// Retorna organization_id si la clave es válida y no revocada.
export async function checkApiKey(request: Request): Promise<{ orgId: string } | { error: string; status: number }> {
  const auth = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/.exec(auth);
  if (!match) return { error: "Falta Bearer API key", status: 401 };
  const { createHash, timingSafeEqual } = await import("crypto");
  const hash = createHash("sha256").update(match[1]).digest("hex");
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "sin-clave",
  );
  const { data } = await admin.from("api_keys").select("organization_id,hash,revoked_at").eq("hash", hash).single();
  if (!data || data.revoked_at) return { error: "API key inválida", status: 401 };
  const a = Buffer.from(data.hash);
  const b = Buffer.from(hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "API key inválida", status: 401 };
  return { orgId: data.organization_id as string };
}
