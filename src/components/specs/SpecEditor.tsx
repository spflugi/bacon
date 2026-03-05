import { useState, useEffect } from "react";
import { X, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Specification, SpecPriority, SpecStatus, SpecType } from "@/types";
import { useSpecStore } from "@/store/specStore";
import { useProjectStore } from "@/store/projectStore";

interface SpecEditorProps {
  specId: string | null; // null = new
  onClose: () => void;
}

const CATEGORIES = {
  functional: ["Business", "UI/UX", "Integration", "Reporting", "Authentication", "Other"],
  non_functional: ["Performance", "Security", "Scalability", "Usability", "Reliability", "Maintainability", "Compatibility", "Other"],
};

function emptySpec(): Omit<Specification, "id" | "spec_id" | "project_id" | "version" | "created_at" | "updated_at"> {
  return {
    type: "functional",
    category: "Business",
    title: "",
    description: "",
    acceptance_criteria: "",
    status: "draft",
    priority: "medium",
    tags: [],
    notes: "",
  };
}

export function SpecEditor({ specId, onClose }: SpecEditorProps) {
  const { specs, add, update } = useSpecStore();
  const { activeProjectId, projects } = useProjectStore();
  const project = projects.find((p) => p.id === activeProjectId);

  const existing = specId ? specs.find((s) => s.id === specId) : undefined;
  const [form, setForm] = useState(existing ? { ...existing } : emptySpec());
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");

  useEffect(() => {
    if (existing) setForm({ ...existing });
  }, [specId]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags.includes(t)) { setTagInput(""); return; }
    set("tags", [...form.tags, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", form.tags.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!form.title.trim() || !activeProjectId || !project) return;
    setSaving(true);
    try {
      if (existing) {
        await update(
          { ...existing, ...form } as Specification,
          changeSummary || "Updated"
        );
      } else {
        await add(activeProjectId, project.prefix, form);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const categories = CATEGORIES[form.type as SpecType] ?? CATEGORIES.functional;

  return (
    <div className="flex flex-col h-full bg-[var(--color-card)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-sm font-semibold">
            {existing ? (
              <span>
                Edit{" "}
                <span className="font-mono text-[var(--color-primary)]">{existing.spec_id}</span>
              </span>
            ) : (
              "New Specification"
            )}
          </h2>
          {existing && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              v{existing.version} · Last modified {new Date(existing.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="spec-title">Title *</Label>
          <Input
            id="spec-title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Short descriptive title"
            autoFocus={!existing}
          />
        </div>

        {/* Type + Category + Priority + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => {
                set("type", v as SpecType);
                set("category", CATEGORIES[v as SpecType][0]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="non_functional">Non-Functional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priority *</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v as SpecPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status *</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as SpecStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="spec-desc">Description</Label>
          <Textarea
            id="spec-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Detailed description of this specification..."
            rows={5}
          />
        </div>

        {/* Acceptance Criteria */}
        <div className="space-y-1.5">
          <Label htmlFor="spec-ac">Acceptance Criteria</Label>
          <Textarea
            id="spec-ac"
            value={form.acceptance_criteria}
            onChange={(e) => set("acceptance_criteria", e.target.value)}
            placeholder="- Given ... When ... Then ...&#10;- The system shall ..."
            rows={4}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="spec-notes">Notes</Label>
          <Textarea
            id="spec-notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Implementation notes, references, open questions..."
            rows={2}
          />
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
              <Input
                className="pl-8"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
                placeholder="Add tag and press Enter"
              />
            </div>
            <Button variant="outline" size="icon" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="rounded-sm hover:bg-[var(--color-border)] p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Change summary (only for edits) */}
        {existing && (
          <div className="space-y-1.5">
            <Label htmlFor="spec-change">Change Summary</Label>
            <Input
              id="spec-change"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Brief description of what changed (saved to history)"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--color-border)] flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
          {saving ? "Saving..." : existing ? "Save Changes" : "Create Spec"}
        </Button>
      </div>
    </div>
  );
}
