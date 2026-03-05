import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpecFilters } from "./SpecFilters";
import { PriorityBadge, StatusBadge } from "./SpecBadges";
import { useSpecStore } from "@/store/specStore";
import { useProjectStore } from "@/store/projectStore";
import { cn } from "@/lib/utils";

interface SpecListProps {
  onNew: () => void;
}

export function SpecList({ onNew }: SpecListProps) {
  const { activeProjectId, projects } = useProjectStore();
  const { load, setActive, activeSpecId, filteredSpecs } = useSpecStore();

  const project = projects.find((p) => p.id === activeProjectId);
  const specs = filteredSpecs();

  useEffect(() => {
    if (activeProjectId) load(activeProjectId);
  }, [activeProjectId, load]);

  if (!activeProjectId || !project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
        Select or create a project to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-base font-semibold">{project.name}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {specs.length} specification{specs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={onNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Spec
        </Button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-[var(--color-border)]">
        <SpecFilters />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[120px_1fr_140px_110px_110px] gap-2 px-4 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider border-b border-[var(--color-border)]">
        <span>ID</span>
        <span>Title</span>
        <span>Type</span>
        <span>Priority</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {specs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted-foreground)]">
            <p className="text-sm">No specifications found.</p>
            <Button variant="outline" size="sm" onClick={onNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add first spec
            </Button>
          </div>
        )}
        {specs.map((spec) => (
          <div
            key={spec.id}
            onClick={() => setActive(spec.id)}
            className={cn(
              "grid grid-cols-[120px_1fr_140px_110px_110px] gap-2 px-4 py-2.5 border-b border-[var(--color-border)]/50 cursor-pointer transition-colors hover:bg-[var(--color-accent)]/40",
              activeSpecId === spec.id && "bg-[var(--color-accent)]"
            )}
          >
            <span className="text-xs font-mono text-[var(--color-primary)] truncate self-center">
              {spec.spec_id}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0 self-center">
              <span className="text-sm font-medium truncate">{spec.title}</span>
              {spec.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {spec.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {spec.tags.length > 3 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      +{spec.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="self-center">
              <Badge variant={spec.type === "functional" ? "default" : "secondary"} className="text-[10px]">
                {spec.type === "functional" ? "Functional" : "Non-Functional"}
              </Badge>
            </div>
            <div className="self-center">
              <PriorityBadge priority={spec.priority} />
            </div>
            <div className="self-center">
              <StatusBadge status={spec.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
