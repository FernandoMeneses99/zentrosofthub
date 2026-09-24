import Link from "next/link";
import { LayoutDashboard, Building2, Clock, ShieldCheck, User, Inbox, FolderKanban, Users } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/crm", label: "CRM", Icon: Building2 },
  { href: "/horas", label: "Horas", Icon: Clock },
  { href: "/tickets", label: "Tickets", Icon: Inbox },
  { href: "/proyectos", label: "Proyectos", Icon: FolderKanban },
  { href: "/usuarios", label: "Usuarios", Icon: Users },
  { href: "/auditoria", label: "Auditoría", Icon: ShieldCheck },
  { href: "/perfil", label: "Perfil", Icon: User },
];

export default function HubNav() {
  return (
    <nav className="flex items-center gap-1 bg-[#0a1628] px-6 py-3 text-slate-200">
      <strong className="mr-4 text-white">Zentrosoft Hub</strong>
      {links.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-[#132238] hover:text-[#4fd290]"
        >
          <Icon size={16} /> {label}
        </Link>
      ))}
    </nav>
  );
}
