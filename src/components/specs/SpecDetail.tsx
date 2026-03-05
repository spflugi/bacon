import { Pencil, Trash2, Link, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge, StatusBadge, TypeBadge } from "./SpecBadges";
import { useSpecStore } from "@/store/specStore";

interface SpecDetailProps {
  specId: string;
  onEdit: (id: string) => void;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">{label}</p>
      <div className="text-sm text-[var(--color-foreground)]">{children}</div>
    </div>
  );
}

export function SpecDetail({ specId, onEdit, onClose }: SpecDetailProps) {
  const { specs, remove, links, removeLink } = useSpecStore();
  const spec = specs.find((s) => s.id === specId);

  if (!spec) return null;

  const outLinks = links.filter((l) => l.source_id === specId);
  const inLinks = links.filter((l) => l.target_id === specId);

  function getLinkedSpec(id: string) {
    return specs.find((s) => s.id === id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[var(--color-primary)] text-sm font-semibold">{spec.spec_id}</span>
            <TypeBadge type={spec.type} />
            <Badge variant="secondary" className="text-xs">{spec.category}</Badge>
          </div>
          <h2 className="text-base font-semibold mt-1 leading-snug">{spec.title}</h2>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            v{spec.version} · Created {new Date(spec.created_at).toLocaleDateString()} · Modified{" "}
            {new Date(spec.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onEdit(spec.id)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
            onClick={() => remove(spec.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Badges row */}
        <div className="flex gap-2 flex-wrap">
          <PriorityBadge priority={spec.priority} />
          <StatusBadge status={spec.status} />
        </div>

        {spec.description && (
          <Field label="Description">
            <p className="whitespace-pre-wrap leading-relaxed">{spec.description}</p>
          </Field>
        )}

        {spec.acceptance_criteria && (
          <Field label="Acceptance Criteria">
            <p className="whitespace-pre-wrap leading-relaxed">{spec.acceptance_criteria}</p>
          </Field>
        )}

        {spec.notes && (
          <Field label="Notes">
            <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-muted-foreground)]">
              {spec.notes}
            </p>
          </Field>
        )}

        {spec.tags.length > 0 && (
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {spec.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </Field>
        )}

        {(outLinks.length > 0 || inLinks.length > 0) && (
          <>
            <Separator />
            <Field label="Links">
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
                        onClick={() => removeLink(link.id)}
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
            </Field>
          </>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[var(--color-border)]">
        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => onEdit(spec.id)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Specification
        </Button>
      </div>
    </div>
  );
}
