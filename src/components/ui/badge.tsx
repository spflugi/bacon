import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30",
        secondary:
          "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        destructive:
          "bg-[var(--color-destructive)]/15 text-[var(--color-destructive)] border border-[var(--color-destructive)]/30",
        outline:
          "border border-[var(--color-border)] text-[var(--color-foreground)]",
        success:
          "bg-green-500/15 text-green-400 border border-green-500/30",
        warning:
          "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
