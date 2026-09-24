import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b82c3]/50 disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#4b82c3] text-white hover:bg-[#3a6aa3]",
        secondary: "bg-[#4fd290]/15 text-[#0a1628] hover:bg-[#4fd290]/25",
        outline: "border border-[#e6ebf2] bg-white text-[#1e293b] hover:border-[#bcd2ec]",
        ghost: "text-[#4b82c3] hover:bg-[#4b82c3]/10",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
