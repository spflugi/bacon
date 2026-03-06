import { useEffect, useState } from "react";
import { Check, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { useSpecStore } from "@/store/specStore";
import { exportToMarkdown } from "@/lib/export";
import { getSpecLinks } from "@/lib/db";
import { writeWorkspaceSpec, getAllSpecLinks, updateClaudeMd } from "@/lib/workspace";
import type { SpecLink } from "@/types";

export function ExportView() {
  const { activeProjectId, projects } = useProjectStore();
  const { specs, load } = useSpecStore();
  const project = projects.find((p) => p.id === activeProjectId);
  const [links, setLinks] = useState<SpecLink[]>([]);
  const [syncState, setSyncState] = useState<"idle" | "synced" | "error">("idle");
  const [syncError, setSyncError] = useState<string>("");
  const [claudeState, setClaudeState] = useState<"idle" | "done" | "error">("idle");

  useEffect(() => {
    if (activeProjectId) {
      load(activeProjectId);
    }
  }, [activeProjectId, load]);

  useEffect(() => {
    async function loadAllLinks() {
      const all: SpecLink[] = [];
      const seen = new Set<string>();
      for (const spec of specs) {
        const specLinks = await getSpecLinks(spec.id);
        for (const l of specLinks) {
          if (!seen.has(l.id)) {
            seen.add(l.id);
            all.push(l);
          }
        }
      }
      setLinks(all);
    }
    if (specs.length > 0) loadAllLinks();
    else setLinks([]);
  }, [specs]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
        Select a project to export.
      </div>
    );
  }

  // project is guaranteed defined here (early return above handles undefined)
  const p = project!;
  const markdown = exportToMarkdown(p, specs, links);
  const filename = `${p.prefix.toLowerCase()}-specifications.md`;
  const hasWorkspace = Boolean(p.workspace_path);

  async function syncToWorkspace() {
    if (!p.workspace_path) return;
    try {
      const allLinks = await getAllSpecLinks(specs);
      await writeWorkspaceSpec(p, specs, allLinks);
      setSyncState("synced");
      setSyncError("");
      setTimeout(() => setSyncState("idle"), 2000);
    } catch (e) {
      setSyncError(String(e));
      setSyncState("error");
      setTimeout(() => setSyncState("idle"), 30000);
    }
  }

  async function generateClaudeMd() {
    if (!p.workspace_path) return;
    try {
      await updateClaudeMd(p.workspace_path, p);
      setClaudeState("done");
      setTimeout(() => setClaudeState("idle"), 2000);
    } catch {
      setClaudeState("error");
      setTimeout(() => setClaudeState("idle"), 3000);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Workspace banner */}
      {hasWorkspace && (
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-card)]">
          <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">Workspace:</span>
          <span className="text-xs font-mono text-[var(--color-foreground)] truncate flex-1">
            {p.workspace_path}
          </span>
          <div className="flex gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={syncToWorkspace}
              disabled={syncState === "synced"}
              className="gap-1.5 h-7 text-xs"
            >
              {syncState === "synced" ? (
                <><Check className="h-3.5 w-3.5 text-green-400" />Synced</>
              ) : syncState === "error" ? (
                <><RefreshCw className="h-3.5 w-3.5 text-red-400" />Failed</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" />Write SPECS.md</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateClaudeMd}
              disabled={claudeState === "done"}
              className="gap-1.5 h-7 text-xs"
            >
              {claudeState === "done" ? (
                <><Check className="h-3.5 w-3.5 text-green-400" />Done</>
              ) : claudeState === "error" ? (
                <><FileText className="h-3.5 w-3.5 text-red-400" />Failed</>
              ) : (
                <><FileText className="h-3.5 w-3.5" />Update {p.agent_file ?? "CLAUDE.md"}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Workspace error */}
      {syncState === "error" && syncError && (
        <div className="px-5 py-2 bg-[var(--color-destructive)]/10 border-b border-[var(--color-destructive)]/30 text-xs text-[var(--color-destructive)] font-mono break-all">
          {syncError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-base font-semibold">Export — {p.name}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {specs.length} specification{specs.length !== 1 ? "s" : ""} · Markdown format · <span className="font-mono">{filename}</span>
            {!hasWorkspace && (
              <span className="ml-2 text-[var(--color-muted-foreground)]/60">
                · Link a workspace in project settings to enable live sync
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-y-auto p-5">
        <pre className="text-xs text-[var(--color-foreground)] font-mono whitespace-pre-wrap bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 leading-relaxed">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
