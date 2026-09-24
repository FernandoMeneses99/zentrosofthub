import type { Metadata } from "next";

export const metadata: Metadata = { title: "Zentrosoft Client Hub", description: "Centro operativo interno de Zentrosoft" };

import AppShell from "@/components/AppShell";
import { createServerSupabase } from "@/lib/supabase-server";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase().catch(() => null);
  const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
  return (
    <html lang="es">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", margin: 0 }}>
        <AppShell email={data?.user?.email ?? null}>{children}</AppShell>
      </body>
    </html>
  );
}
