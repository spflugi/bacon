import { useState } from "react";
import { FolderOpen, Plus, Pencil, Trash2, LayoutDashboard, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProjectForm } from "./ProjectForm";
import { useProjectStore } from "@/store/projectStore";
import { initWorkspaceFiles } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

export type View = "dashboard" | "specs";

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
}

export function Sidebar({ view, onViewChange }: SidebarProps) {
  const { projects, activeProjectId, setActive, add, update, remove } = useProjectStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openNew() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function openEdit(p: Project, e: React.MouseEvent) {
    e.stopPropagation();
    setEditTarget(p);
    setFormOpen(true);
  }

  function handleSave(data: Omit<Project, "id" | "created_at" | "updated_at">) {
    if (editTarget) {
      const updated = { ...editTarget, ...data };
      update(updated).then(() => {
        if (updated.workspace_path) initWorkspaceFiles(updated);
      });
    } else {
      add(data).then((p) => {
        setActive(p.id);
        if (p.workspace_path) initWorkspaceFiles(p);
      });
    }
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDeleteId(id);
  }

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "specs", label: "Specifications", icon: <ListChecks className="h-4 w-4" /> },
  ];

  return (
    <aside className="flex flex-col w-56 shrink-0 bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)] h-full select-none">
      {/* App title */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--color-sidebar-border)]">
        <span className="text-[var(--color-primary)] font-bold text-lg tracking-tight">Bacon</span>
        <span className="text-[var(--color-muted-foreground)] text-xs">v0.1</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors w-full text-left",
              view === item.id
                ? "bg-[var(--color-accent)] text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]/50 hover:text-[var(--color-foreground)]"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <Separator />

      {/* Projects */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
          Projects
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={openNew} title="New project">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {projects.length === 0 && (
          <p className="text-xs text-[var(--color-muted-foreground)] px-2 py-4 text-center">
            No projects yet.
            <br />
            <button onClick={openNew} className="text-[var(--color-primary)] hover:underline mt-1">
              Create one
            </button>
          </p>
        )}
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => { setActive(p.id); onViewChange("specs"); }}
            className={cn(
              "group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
              activeProjectId === p.id
                ? "bg-[var(--color-accent)] text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)]/50 hover:text-[var(--color-foreground)]"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{p.name}</span>
            <span className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={(e) => openEdit(p, e)}
                className="p-0.5 rounded hover:text-[var(--color-foreground)]"
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </button>
              {confirmDeleteId === p.id ? (
                <span className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(p.id); setConfirmDeleteId(null); }}
                    className="px-1 py-0.5 rounded text-[10px] bg-[var(--color-destructive)] text-white"
                  >
                    Yes
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                    className="px-1 py-0.5 rounded text-[10px] bg-[var(--color-secondary)] text-[var(--color-foreground)]"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  className="p-0.5 rounded hover:text-[var(--color-destructive)]"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editTarget}
      />
    </aside>
  );
}
