"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/card";
import Link from "next/link";
import CompanyActions from "./CompanyActions";
import ContactEraseButton from "./ContactEraseButton";

type Company = { id: string; razon_social: string; nit: string | null; estado: string; email: string | null; ciudad: string | null };
type Contact = { id: string; nombre: string; apellido: string | null; email: string | null; rol_cliente: string };

const companyColsBase: ColumnDef<Company>[] = [
  { accessorKey: "razon_social", header: "Razón social", cell: ({ row }) => <Link href={`/crm/${row.original.id}`}>{row.original.razon_social}</Link> },
  { accessorKey: "nit", header: "NIT", cell: ({ row }) => row.original.nit ?? "—" },
  { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? "—" },
  { accessorKey: "ciudad", header: "Ciudad", cell: ({ row }) => row.original.ciudad ?? "—" },
  { accessorKey: "estado", header: "Estado", cell: ({ row }) => <Badge tone={row.original.estado === "activa" ? "ok" : "default"}>{row.original.estado}</Badge> },
];

export function CompaniesTable({ rows, write }: { rows: Company[]; write: boolean }) {
  const cols: ColumnDef<Company>[] = [
    ...companyColsBase,
    ...(write ? [{ id: "acciones", header: "Acciones", cell: ({ row }: { row: { original: Company } }) => <CompanyActions id={row.original.id} razon={row.original.razon_social} /> } as ColumnDef<Company>] : []),
  ];
  return <DataTable columns={cols} data={rows} />;
}

export function ContactsTable({ rows, orgId, write }: { rows: Contact[]; orgId: string; write: boolean }) {
  const contactCols: ColumnDef<Contact>[] = [
    { accessorFn: (r) => `${r.nombre} ${r.apellido ?? ""}`.trim(), id: "nombre", header: "Nombre" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? "—" },
    { accessorKey: "rol_cliente", header: "Rol", cell: ({ row }) => <Badge tone="info">{row.original.rol_cliente}</Badge> },
    ...(write ? [{ id: "acciones", header: "Acciones", cell: ({ row }: { row: { original: Contact } }) => <ContactEraseButton orgId={orgId} contactId={row.original.id} nombre={row.original.nombre} /> } as ColumnDef<Contact>] : []),
  ];
  return <DataTable columns={contactCols} data={rows} />;
}
