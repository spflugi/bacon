import { create } from "zustand";
import type { Project, Specification } from "@/types";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  createSpecification,
  createSpecLink,
  getNextSpecId,
} from "@/lib/db";
import type { ParsedImport } from "@/lib/import";

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setActive: (id: string | null) => void;
  add: (project: Omit<Project, "id" | "created_at" | "updated_at">) => Promise<Project>;
  update: (project: Project) => Promise<void>;
  remove: (id: string) => Promise<void>;
  importProject: (parsed: ParsedImport, workspacePath: string) => Promise<Project>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await getProjects();
      set({ projects, loading: false });
      // Auto-select first project if none selected
      if (!get().activeProjectId && projects.length > 0) {
        set({ activeProjectId: projects[0].id });
      }
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  setActive: (id) => set({ activeProjectId: id }),

  add: async (data) => {
    const now = new Date().toISOString();
    const project: Project = {
      workspace_path: "",
      agent_file: "CLAUDE.md",
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...data,
    };
    await createProject(project);
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  update: async (project) => {
    const updated = { ...project, updated_at: new Date().toISOString() };
    await updateProject(updated);
    set((s) => ({
      projects: s.projects.map((p) => (p.id === updated.id ? updated : p)),
    }));
  },

  remove: async (id) => {
    await deleteProject(id);
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id);
      const activeProjectId =
        s.activeProjectId === id
          ? projects[0]?.id ?? null
          : s.activeProjectId;
      return { projects, activeProjectId };
    });
  },

  importProject: async (parsed, workspacePath) => {
    const project = await get().add({
      name: parsed.projectName,
      description: parsed.projectDescription,
      prefix: parsed.projectPrefix,
      workspace_path: workspacePath,
      agent_file: "CLAUDE.md",
    });

    // Create all specs, mapping original spec IDs to new DB row IDs for link resolution
    const idMap = new Map<string, string>();
    for (const s of parsed.specs) {
      const newSpecId = await getNextSpecId(project.id, project.prefix, s.type);
      const now = new Date().toISOString();
      const spec: Specification = {
        id: crypto.randomUUID(),
        spec_id: newSpecId,
        project_id: project.id,
        type: s.type,
        category: s.category,
        title: s.title,
        description: s.description,
        acceptance_criteria: s.acceptance_criteria,
        status: s.status,
        priority: s.priority,
        tags: s.tags,
        version: s.version,
        notes: s.notes,
        created_at: now,
        updated_at: now,
      };
      await createSpecification(spec);
      idMap.set(s.originalSpecId, spec.id);
    }

    // Create links, skipping any that reference specs outside the import
    for (const link of parsed.links) {
      const sourceId = idMap.get(link.sourceOriginalId);
      const targetId = idMap.get(link.targetOriginalId);
      if (!sourceId || !targetId) continue;
      await createSpecLink({
        id: crypto.randomUUID(),
        source_id: sourceId,
        target_id: targetId,
        link_type: link.link_type,
        notes: "",
      });
    }

    return project;
  },
}));
