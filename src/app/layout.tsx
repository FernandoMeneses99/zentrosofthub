import type { Metadata } from "next";

export const metadata: Metadata = { title: "Zentrosoft Client Hub", description: "Centro operativo interno de Zentrosoft" };

import AppShell from "@/components/AppShell";
import { createServerSupabase } from "@/lib/supabase-server";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase().catch(() => null);
  const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
  let role: string | null = null;
  if (data?.user) {
    const { data: m } = await supabase!.from("organization_members").select("tenant_role").eq("user_id", data.user.id).limit(1);
    role = m?.[0]?.tenant_role ?? null;
  }
  return (
    <html lang="es">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", margin: 0 }}>
        <AppShell email={data?.user?.email ?? null} role={role}>{children}</AppShell>
      </body>
    </html>
  );
}
