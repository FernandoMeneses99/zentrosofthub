"use client";
import { Button } from "./button";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function ExportCsv({ rows, filename, label }: { rows: Record<string, unknown>[]; filename: string; label: string }) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      }}
    >
      ⬇ {label}
    </Button>
  );
}
