import { Badge } from "@/components/ui/badge";
import type { SpecPriority, SpecStatus, SpecType } from "@/types";

export function PriorityBadge({ priority }: { priority: SpecPriority }) {
  const map: Record<SpecPriority, { label: string; variant: "destructive" | "warning" | "default" | "outline" }> = {
    critical: { label: "Critical", variant: "destructive" },
    high: { label: "High", variant: "warning" },
    medium: { label: "Medium", variant: "default" },
    low: { label: "Low", variant: "outline" },
  };
  const { label, variant } = map[priority];
  return <Badge variant={variant}>{label}</Badge>;
}

export function StatusBadge({ status }: { status: SpecStatus }) {
  const map: Record<SpecStatus, { label: string; variant: "success" | "default" | "outline" | "secondary" }> = {
    implemented: { label: "Implemented", variant: "success" },
    approved: { label: "Approved", variant: "default" },
    draft: { label: "Draft", variant: "outline" },
    deprecated: { label: "Deprecated", variant: "secondary" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function TypeBadge({ type }: { type: SpecType }) {
  return (
    <Badge variant={type === "functional" ? "default" : "secondary"}>
      {type === "functional" ? "Functional" : "Non-Functional"}
    </Badge>
  );
}
