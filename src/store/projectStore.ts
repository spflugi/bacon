import { create } from "zustand";
import type { Project } from "@/types";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/db";

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
}));
