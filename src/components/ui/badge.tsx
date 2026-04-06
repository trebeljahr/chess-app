import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white",
        secondary: "bg-stone-200 text-slate-900",
        outline: "border border-stone-300 bg-white text-slate-700",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
