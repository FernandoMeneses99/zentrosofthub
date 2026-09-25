"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Clock, ShieldCheck, User, Inbox,
  FolderKanban, Users, Files, Bell, LogOut, Wrench, ChartBar, Settings, BookOpen, House, CalendarClock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

const links = [
  { href: "/portal", label: "Portal", Icon: House, roles: ["client"] },
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, roles: ["owner", "admin", "manager", "employee", "viewer"] },
  { href: "/crm", label: "CRM", Icon: Building2, roles: ["owner", "admin", "manager"] },
  { href: "/horas", label: "Horas", Icon: Clock, roles: ["owner", "admin", "manager", "employee", "viewer"] },
  { href: "/tickets", label: "Tickets", Icon: Inbox, roles: ["owner", "admin", "manager", "employee", "client"] },
  { href: "/servicio", label: "Servicio", Icon: Wrench, roles: null },
  { href: "/mantenimientos", label: "Mantenimientos", Icon: CalendarClock, roles: null },
  { href: "/reportes", label: "Reportes", Icon: ChartBar, roles: ["owner", "admin", "manager"] },
  { href: "/proyectos", label: "Proyectos", Icon: FolderKanban, roles: ["owner", "admin", "manager"] },
  { href: "/documentos", label: "Documentos", Icon: Files, roles: ["owner", "admin", "manager"] },
  { href: "/usuarios", label: "Usuarios", Icon: Users, roles: ["owner", "admin"] },
  { href: "/auditoria", label: "Auditoría", Icon: ShieldCheck, roles: ["owner", "admin"] },
  { href: "/notificaciones", label: "Avisos", Icon: Bell, roles: ["owner", "admin", "manager", "employee"] },
  { href: "/kb", label: "Conocimiento", Icon: BookOpen, roles: ["owner", "admin", "manager", "employee"] },
  { href: "/ajustes", label: "Ajustes", Icon: Settings, roles: ["owner", "admin"] },
  { href: "/perfil", label: "Perfil", Icon: User, roles: null },
];

export default function AppShell({ children, email, role }: {
  children: React.ReactNode; email: string | null; role: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!email) return;
    fetch("/api/notificaciones/count").then((r) => r.json()).then((j) => {
      if (typeof j.total === "number") setCount(j.total);
    }).catch(() => {});
  }, [email, pathname]);

  if (pathname === "/login" || pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-[#0a1628] text-slate-200">
        <div className="flex items-center gap-2 px-5 pb-4 pt-5">
          <span className="grid size-9 place-content-center rounded-xl bg-gradient-to-br from-[#4b82c3] to-[#4fd290] font-extrabold text-[#0a1628]">Z</span>
          <span>
            <strong className="block text-sm text-white">Zentrosoft Hub</strong>
            <span className="block text-[11px] text-slate-400">Operación interna</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Principal">
          {links
            .filter((l) => !l.roles || (role && l.roles.includes(role)))
            .map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-[#4b82c3]/20 font-semibold text-white" : "text-slate-300 hover:bg-[#132238] hover:text-[#4fd290]"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
                {href === "/notificaciones" && count !== null && count > 0 && (
                  <span className="ml-auto rounded-full bg-[#4fd290] px-2 py-0.5 text-[11px] font-bold text-[#0a1628]">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs text-slate-300" title={email ?? ""}>{email ?? "Sin sesión"}</p>
          <button
            onClick={async () => {
              await createClient().auth.signOut();
              router.push("/login");
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-[#132238] hover:text-white"
          >
            <LogOut size={16} aria-hidden="true" /> Salir
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
