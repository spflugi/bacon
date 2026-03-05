import { create } from "zustand";
import type { Specification, SpecLink, SpecPriority, SpecStatus, SpecType } from "@/types";
import {
  getSpecifications,
  createSpecification,
  updateSpecification,
  deleteSpecification,
  getSpecLinks,
  createSpecLink,
  deleteSpecLink,
  getNextSpecId,
  saveSpecHistory,
} from "@/lib/db";

interface Filters {
  search: string;
  type: SpecType | "all";
  status: SpecStatus | "all";
  priority: SpecPriority | "all";
  tag: string;
}

interface SpecStore {
  specs: Specification[];
  links: SpecLink[];
  activeSpecId: string | null;
  filters: Filters;
  loading: boolean;
  error: string | null;

  load: (projectId: string) => Promise<void>;
  setActive: (id: string | null) => void;
  setFilters: (filters: Partial<Filters>) => void;
  filteredSpecs: () => Specification[];

  add: (
    projectId: string,
    prefix: string,
    data: Omit<Specification, "id" | "spec_id" | "project_id" | "version" | "created_at" | "updated_at">
  ) => Promise<Specification>;
  update: (spec: Specification, changeSummary?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  loadLinks: (specId: string) => Promise<void>;
  addLink: (link: Omit<SpecLink, "id">) => Promise<void>;
  removeLink: (id: string) => Promise<void>;
}

export const useSpecStore = create<SpecStore>((set, get) => ({
  specs: [],
  links: [],
  activeSpecId: null,
  filters: { search: "", type: "all", status: "all", priority: "all", tag: "" },
  loading: false,
  error: null,

  load: async (projectId) => {
    set({ loading: true, error: null, specs: [], activeSpecId: null });
    try {
      const specs = await getSpecifications(projectId);
      set({ specs, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  setActive: (id) => {
    set({ activeSpecId: id });
    if (id) get().loadLinks(id);
  },

  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),

  filteredSpecs: () => {
    const { specs, filters } = get();
    return specs.filter((s) => {
      if (filters.type !== "all" && s.type !== filters.type) return false;
      if (filters.status !== "all" && s.status !== filters.status) return false;
      if (filters.priority !== "all" && s.priority !== filters.priority) return false;
      if (filters.tag && !s.tags.includes(filters.tag)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !s.title.toLowerCase().includes(q) &&
          !s.spec_id.toLowerCase().includes(q) &&
          !s.description.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  },

  add: async (projectId, prefix, data) => {
    const now = new Date().toISOString();
    const spec_id = await getNextSpecId(projectId, prefix, data.type);
    const spec: Specification = {
      id: crypto.randomUUID(),
      spec_id,
      project_id: projectId,
      version: 1,
      created_at: now,
      updated_at: now,
      ...data,
    };
    await createSpecification(spec);
    set((s) => ({ specs: [...s.specs, spec] }));
    return spec;
  },

  update: async (spec, changeSummary = "Updated") => {
    const existing = get().specs.find((s) => s.id === spec.id);
    if (existing) {
      await saveSpecHistory(existing.id, existing, changeSummary);
    }
    const updated: Specification = {
      ...spec,
      version: (existing?.version ?? spec.version) + 1,
      updated_at: new Date().toISOString(),
    };
    await updateSpecification(updated);
    set((s) => ({
      specs: s.specs.map((sp) => (sp.id === updated.id ? updated : sp)),
    }));
  },

  remove: async (id) => {
    await deleteSpecification(id);
    set((s) => ({
      specs: s.specs.filter((sp) => sp.id !== id),
      activeSpecId: s.activeSpecId === id ? null : s.activeSpecId,
    }));
  },

  loadLinks: async (specId) => {
    const links = await getSpecLinks(specId);
    set({ links });
  },

  addLink: async (data) => {
    const link: SpecLink = { id: crypto.randomUUID(), ...data };
    await createSpecLink(link);
    set((s) => ({ links: [...s.links, link] }));
  },

  removeLink: async (id) => {
    await deleteSpecLink(id);
    set((s) => ({ links: s.links.filter((l) => l.id !== id) }));
  },
}));
