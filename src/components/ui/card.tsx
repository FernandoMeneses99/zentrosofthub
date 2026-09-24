import * as React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[18px] border border-[#e6ebf2] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold uppercase tracking-wide text-[#64748b]", className)} {...props} />;
}

export function Badge({ className, tone = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "ok" | "warn" | "info" }) {
  const tones: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    ok: "bg-[#4fd290]/20 text-[#14532d]",
    warn: "bg-amber-100 text-amber-800",
    info: "bg-[#4b82c3]/10 text-[#3a6aa3]",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)} {...props} />
  );
}
