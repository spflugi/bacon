import { useEffect, useRef } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useSpecStore } from "@/store/specStore";
import {
  writeWorkspaceSpec,
  watchWorkspaceSpec,
  getAllSpecLinks,
  markWritePending,
  resetWritePending,
} from "@/lib/workspace";
import { getSpecifications } from "@/lib/db";
import type { StatusChange } from "@/lib/workspace";

export function useWorkspaceSync() {
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  // Only fires on add/update/remove — not on load — preventing spurious overwrites on navigation
  const lastMutatedAt = useSpecStore((s) => s.lastMutatedAt);

  const unwatchRef = useRef<(() => void) | null>(null);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const project = projects.find((p) => p.id === activeProjectId);
  const workspacePath = project?.workspace_path || "";
  const projectId = project?.id;

  // Start/stop polling when the linked workspace changes
  useEffect(() => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }

    if (workspacePath && projectId) {
      unwatchRef.current = watchWorkspaceSpec(
        workspacePath,
        (changes: StatusChange[]) => {
          for (const change of changes) {
            // Read directly from Zustand state (synchronously updated after set())
            // so we never act on a stale snapshot from a previous render.
            const spec = useSpecStore
              .getState()
              .specs.find((s) => s.spec_id === change.spec_id);
            if (spec) {
              useSpecStore
                .getState()
                .update(
                  { ...spec, status: change.status },
                  `Status set to "${change.status}" by agent`
                );
            }
          }
        },
        () => useSpecStore.getState().specs
      );
    }

    return () => {
      unwatchRef.current?.();
      unwatchRef.current = null;
    };
  }, [workspacePath, projectId]);

  // Debounced write on spec mutations (add/update/remove) or when workspace is first linked.
  // Deliberately NOT triggered by load() to avoid overwriting SPECS.md on navigation.
  useEffect(() => {
    if (!workspacePath || !projectId) return;

    if (writeTimerRef.current !== null) clearTimeout(writeTimerRef.current);
    // Suppress the watcher immediately so it doesn't see a stale file status and
    // revert an in-app status change before the debounce fires.
    markWritePending();
    writeTimerRef.current = setTimeout(async () => {
      // Mark the timer as fired before the async work so the cleanup can distinguish
      // a pending timer from one that has already run.
      writeTimerRef.current = null;
      const currentProject = useProjectStore
        .getState()
        .projects.find((p) => p.id === projectId);
      if (!currentProject?.workspace_path) return;
      try {
        // Fetch specs fresh from DB so we always write the full current state,
        // even on startup before any view has called load().
        const currentSpecs = await getSpecifications(projectId);
        const links = await getAllSpecLinks(currentSpecs);
        await writeWorkspaceSpec(currentProject, currentSpecs, links);
      } catch (e) {
        console.error("[workspace] Failed to write spec file:", e);
      }
    }, 500);

    return () => {
      // Only reset the flag if the timer hasn't fired yet. If it fired, writeWorkspaceSpec
      // is managing the flag and will reset it after the OS watcher event arrives.
      if (writeTimerRef.current !== null) {
        clearTimeout(writeTimerRef.current);
        writeTimerRef.current = null;
        resetWritePending();
      }
    };
  }, [lastMutatedAt, workspacePath, projectId]);
}
