import Link from "next/link";
import { ChevronRight, House } from "lucide-react";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.label} className="inline-flex items-center" aria-current={last ? "page" : undefined}>
              {i > 0 && <ChevronRight size={15} className="mx-1 text-[#94a3b8]" aria-hidden="true" />}
              {it.href && !last ? (
                <Link href={it.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#3a6aa3]">
                  {i === 0 && <House size={15} aria-hidden="true" />}
                  {it.label}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0a1628]">
                  {i === 0 && <House size={15} aria-hidden="true" />}
                  {it.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
