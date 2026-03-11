import { useEffect, useState } from "react";
import { Check, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { useSpecStore } from "@/store/specStore";
import { updateClaudeMd } from "@/lib/workspace";
import type { SpecPriority, SpecStatus } from "@/types";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
      <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>}
    </div>
  );
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--color-foreground)]">{label}</span>
        <span className="text-[var(--color-muted-foreground)]">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-[var(--color-secondary)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { activeProjectId, projects } = useProjectStore();
  const { specs, load } = useSpecStore();
  const project = projects.find((p) => p.id === activeProjectId);
  const [agentState, setAgentState] = useState<"idle" | "done" | "error">("idle");

  async function handleUpdateAgentFiles() {
    if (!project?.workspace_path) return;
    try {
      await updateClaudeMd(project.workspace_path, project);
      setAgentState("done");
      setTimeout(() => setAgentState("idle"), 2000);
    } catch {
      setAgentState("error");
      setTimeout(() => setAgentState("idle"), 3000);
    }
  }

  useEffect(() => {
    if (activeProjectId) load(activeProjectId);
  }, [activeProjectId, load]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
        Select a project to see its dashboard.
      </div>
    );
  }

  const total = specs.length;
  const functional = specs.filter((s) => s.type === "functional").length;
  const nonFunctional = specs.filter((s) => s.type === "non_functional").length;

  const byStatus: Record<SpecStatus, number> = {
    draft: 0, approved: 0, implemented: 0, deprecated: 0,
  };
  const byPriority: Record<SpecPriority, number> = {
    critical: 0, high: 0, medium: 0, low: 0,
  };
  for (const s of specs) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
    byPriority[s.priority] = (byPriority[s.priority] ?? 0) + 1;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{project.description}</p>
        )}
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          ID prefix: <span className="font-mono text-[var(--color-primary)]">{project.prefix}</span>
        </p>
        {project.workspace_path && (
          <div className="flex items-center gap-2 mt-0.5">
            <p className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] min-w-0">
              <FolderOpen className="h-3 w-3 shrink-0" />
              <span className="font-mono truncate">{project.workspace_path}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateAgentFiles}
              disabled={agentState === "done"}
              className="gap-1.5 h-6 text-xs shrink-0"
            >
              {agentState === "done" ? (
                <><Check className="h-3 w-3 text-green-400" />Updated</>
              ) : agentState === "error" ? (
                <><FileText className="h-3 w-3 text-red-400" />Failed</>
              ) : (
                <><FileText className="h-3 w-3" />Update {project.agent_file ?? "CLAUDE.md"}</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Specs" value={total} />
        <StatCard label="Functional" value={functional} sub={`${nonFunctional} non-functional`} />
        <StatCard label="Implemented" value={byStatus.implemented} sub={`of ${total}`} />
        <StatCard label="Draft" value={byStatus.draft} sub="pending review" />
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By status */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">By Status</h3>
            <Bar label="Draft" count={byStatus.draft} total={total} color="bg-[var(--color-muted-foreground)]" />
            <Bar label="Approved" count={byStatus.approved} total={total} color="bg-[var(--color-primary)]" />
            <Bar label="Implemented" count={byStatus.implemented} total={total} color="bg-green-500" />
            <Bar label="Deprecated" count={byStatus.deprecated} total={total} color="bg-[var(--color-secondary-foreground)]/30" />
          </div>

          {/* By priority */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">By Priority</h3>
            <Bar label="Critical" count={byPriority.critical} total={total} color="bg-[var(--color-destructive)]" />
            <Bar label="High" count={byPriority.high} total={total} color="bg-yellow-500" />
            <Bar label="Medium" count={byPriority.medium} total={total} color="bg-[var(--color-primary)]" />
            <Bar label="Low" count={byPriority.low} total={total} color="bg-[var(--color-muted-foreground)]" />
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">
          No specifications yet. Switch to Specifications to add some.
        </div>
      )}
    </div>
  );
}
