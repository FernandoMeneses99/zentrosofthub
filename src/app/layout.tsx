import type { Metadata } from "next";

export const metadata: Metadata = { title: "Zentrosoft Client Hub", description: "Centro operativo interno de Zentrosoft" };

import HubNav from "@/components/HubNav";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", margin: 0 }}>
        <HubNav />
        {children}
      </body>
    </html>
  );
}
