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
import type { Project } from "@/types";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Project, "id" | "created_at" | "updated_at">) => void;
  initial?: Project;
}

export function ProjectForm({ open, onClose, onSave, initial }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prefix, setPrefix] = useState(initial?.prefix ?? "");

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      prefix: prefix.trim().toUpperCase() || name.trim().toUpperCase().slice(0, 6).replace(/\s+/g, ""),
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
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
