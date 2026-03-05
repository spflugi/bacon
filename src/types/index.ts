export type SpecType = "functional" | "non_functional";

export type SpecStatus = "draft" | "approved" | "implemented" | "deprecated";

export type SpecPriority = "critical" | "high" | "medium" | "low";

export type LinkType =
  | "depends_on"
  | "related_to"
  | "conflicts_with"
  | "implements"
  | "extends";

export interface Project {
  id: string;
  name: string;
  description: string;
  prefix: string;
  workspace_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Specification {
  id: string;
  spec_id: string;
  project_id: string;
  type: SpecType;
  category: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  status: SpecStatus;
  priority: SpecPriority;
  tags: string[];
  version: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SpecLink {
  id: string;
  source_id: string;
  target_id: string;
  link_type: LinkType;
  notes: string;
}

export interface SpecHistory {
  id: string;
  spec_id: string;
  snapshot: Specification;
  changed_at: string;
  change_summary: string;
}

// Raw DB row (tags stored as JSON string)
export interface SpecificationRow
  extends Omit<Specification, "tags"> {
  tags: string;
}
