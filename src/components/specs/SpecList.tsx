import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Link, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SpecFilters } from "./SpecFilters";
import { PriorityBadge, StatusBadge, TypeBadge } from "./SpecBadges";
import { useSpecStore } from "@/store/specStore";
import { useProjectStore } from "@/store/projectStore";
import { cn } from "@/lib/utils";

interface SpecListProps {
  onNew: () => void;
  onEdit: (id: string) => void;
}

const COL = "grid-cols-[20px_120px_1fr_140px_110px_110px]";

export function SpecList({ onNew, onEdit }: SpecListProps) {
  const { activeProjectId, projects } = useProjectStore();
  const { load, filteredSpecs, specs, remove, links, removeLink } = useSpecStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const project = projects.find((p) => p.id === activeProjectId);
  const visibleSpecs = filteredSpecs();

  useEffect(() => {
    if (activeProjectId) load(activeProjectId);
  }, [activeProjectId, load]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(visibleSpecs.map((s) => s.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  function getLinkedSpec(id: string) {
    return specs.find((s) => s.id === id);
  }

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
            {visibleSpecs.length} specification{visibleSpecs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {expandedIds.size > 0 ? (
            <Button variant="ghost" size="sm" onClick={collapseAll} className="gap-1 text-xs h-8">
              <ChevronsDownUp className="h-3.5 w-3.5" />
              Collapse all
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={expandAll} className="gap-1 text-xs h-8" disabled={visibleSpecs.length === 0}>
              <ChevronsUpDown className="h-3.5 w-3.5" />
              Expand all
            </Button>
          )}
          <Button size="sm" onClick={onNew} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Spec
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-[var(--color-border)]">
        <SpecFilters />
      </div>

      {/* Table header */}
      <div className={`grid ${COL} gap-2 px-4 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider border-b border-[var(--color-border)]`}>
        <span />
        <span>ID</span>
        <span>Title</span>
        <span>Type</span>
        <span>Priority</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {visibleSpecs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-muted-foreground)]">
            <p className="text-sm">No specifications found.</p>
            <Button variant="outline" size="sm" onClick={onNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add first spec
            </Button>
          </div>
        )}
        {visibleSpecs.map((spec) => {
          const isExpanded = expandedIds.has(spec.id);
          const outLinks = links.filter((l) => l.source_id === spec.id);
          const inLinks = links.filter((l) => l.target_id === spec.id);
          const hasLinks = outLinks.length > 0 || inLinks.length > 0;

          return (
            <div key={spec.id} className="border-b border-[var(--color-border)]/50">
              {/* Row header */}
              <div
                onClick={() => toggleExpand(spec.id)}
                className={cn(
                  `grid ${COL} gap-2 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-accent)]/40`,
                  isExpanded && "bg-[var(--color-accent)]"
                )}
              >
                <div className="self-center text-[var(--color-muted-foreground)]">
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />
                  }
                </div>
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
                  <TypeBadge type={spec.type} />
                </div>
                <div className="self-center">
                  <PriorityBadge priority={spec.priority} />
                </div>
                <div className="self-center">
                  <StatusBadge status={spec.status} />
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-6 pb-4 pt-3 bg-[var(--color-accent)]/20 space-y-4">
                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <Badge variant="secondary" className="text-xs">{spec.category}</Badge>
                    <span>v{spec.version}</span>
                    <span>·</span>
                    <span>Created {new Date(spec.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>Modified {new Date(spec.updated_at).toLocaleDateString()}</span>
                  </div>

                  {spec.description && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Description</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{spec.description}</p>
                    </div>
                  )}

                  {spec.acceptance_criteria && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Acceptance Criteria</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{spec.acceptance_criteria}</p>
                    </div>
                  )}

                  {spec.notes && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Notes</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--color-muted-foreground)]">{spec.notes}</p>
                    </div>
                  )}

                  {spec.tags.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {spec.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasLinks && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">Links</p>
                        <div className="space-y-1.5">
                          {outLinks.map((link) => {
                            const target = getLinkedSpec(link.target_id);
                            return (
                              <div key={link.id} className="flex items-center gap-2 group">
                                <Link className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] shrink-0" />
                                <span className="text-xs text-[var(--color-muted-foreground)] w-24 shrink-0">
                                  {link.link_type.replace("_", " ")}
                                </span>
                                <span className="font-mono text-xs text-[var(--color-primary)]">
                                  {target?.spec_id ?? "?"}
                                </span>
                                <span className="text-xs flex-1 truncate">{target?.title ?? "(deleted)"}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeLink(link.id); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove link"
                                >
                                  <X className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                                </button>
                              </div>
                            );
                          })}
                          {inLinks.map((link) => {
                            const source = getLinkedSpec(link.source_id);
                            return (
                              <div key={link.id} className="flex items-center gap-2">
                                <Link className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] shrink-0" />
                                <span className="text-xs text-[var(--color-muted-foreground)] w-24 shrink-0">
                                  ← {link.link_type.replace("_", " ")}
                                </span>
                                <span className="font-mono text-xs text-[var(--color-primary)]">
                                  {source?.spec_id ?? "?"}
                                </span>
                                <span className="text-xs flex-1 truncate">{source?.title ?? "(deleted)"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={(e) => { e.stopPropagation(); onEdit(spec.id); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
                      onClick={(e) => { e.stopPropagation(); remove(spec.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
