"use client";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import * as React from "react";
import { cn } from "./cn";

export function DataTable<T>({ columns, data, className }: { columns: ColumnDef<T>[]; data: T[]; className?: string }) {
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([]);
  const table = useReactTable({
    columns,
    data,
    state: { sorting: sorting as never },
    onSortingChange: setSorting as never,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div className={cn("overflow-x-auto rounded-[18px] border border-[#e6ebf2] bg-white", className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#64748b]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  scope="col"
                  aria-sort={h.column.getIsSorted() === "asc" ? "ascending" : h.column.getIsSorted() === "desc" ? "descending" : "none"}
                  onClick={h.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none px-4 py-3 font-semibold"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[#eef2f7]">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#f8fafc]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr><td className="px-4 py-6 text-center text-[#64748b]">Sin registros.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
