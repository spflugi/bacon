import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, X } from "lucide-react";
import type { Project } from "@/types";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Project, "id" | "created_at" | "updated_at">) => void;
  initial?: Project;
}

export function ProjectForm({ open: isOpen, onClose, onSave, initial }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prefix, setPrefix] = useState(initial?.prefix ?? "");
  const [workspacePath, setWorkspacePath] = useState(initial?.workspace_path ?? "");

  async function pickFolder() {
    const folder = await open({ directory: true, title: "Choose agent workspace folder" });
    if (folder) setWorkspacePath(folder as string);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      prefix: prefix.trim().toUpperCase() || name.trim().toUpperCase().slice(0, 6).replace(/\s+/g, ""),
      workspace_path: workspacePath,
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="proj-name">Name *</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proj-prefix">
              ID Prefix{" "}
              <span className="text-[var(--color-muted-foreground)] font-normal text-xs">
                (used in spec IDs, e.g. FR-MYAPP-001)
              </span>
            </Label>
            <Input
              id="proj-prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="MYAPP"
              maxLength={10}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>
              Agent Workspace{" "}
              <span className="text-[var(--color-muted-foreground)] font-normal text-xs">
                (folder where SPECS.md is kept in sync)
              </span>
            </Label>
            {workspacePath ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs font-mono text-[var(--color-foreground)] bg-[var(--color-secondary)] rounded px-2 py-1.5 truncate">
                  {workspacePath}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setWorkspacePath("")} title="Unlink workspace">
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={pickFolder} title="Change folder">
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={pickFolder} className="w-fit gap-1.5">
                <FolderOpen className="h-4 w-4" />
                Link workspace folder
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {initial ? "Save" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
