"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/card";
import MemberActions from "./MemberActions";

export type Member = { user_id: string; tenant_role: string; status: string; display_name: string };

export function MembersTable({ rows, orgId, selfId }: { rows: Member[]; orgId: string; selfId: string }) {
  const cols: ColumnDef<Member>[] = [
    { accessorKey: "display_name", header: "Usuario" },
    { accessorKey: "tenant_role", header: "Rol", cell: ({ row }) => <Badge tone={row.original.tenant_role === "owner" ? "ok" : "info"}>{row.original.tenant_role}</Badge> },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <Badge tone={row.original.status === "active" ? "ok" : "warn"}>{row.original.status}</Badge> },
    { id: "acciones", header: "Acciones", cell: ({ row }) => <MemberActions orgId={orgId} userId={row.original.user_id} role={row.original.tenant_role} status={row.original.status} isSelf={row.original.user_id === selfId} /> },
  ];
  return <DataTable columns={cols} data={rows} />;
}
