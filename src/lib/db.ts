import Database from "@tauri-apps/plugin-sql";
import type {
  Project,
  Specification,
  SpecificationRow,
  SpecLink,
  SpecHistory,
} from "@/types";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load("sqlite:bacon.db");
    await migrate(_db);
  }
  return _db;
}

async function migrate(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      prefix TEXT NOT NULL DEFAULT 'SPEC',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS specifications (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'functional',
      category TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      acceptance_criteria TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      priority TEXT NOT NULL DEFAULT 'medium',
      tags TEXT NOT NULL DEFAULT '[]',
      version INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS spec_links (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES specifications(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES specifications(id) ON DELETE CASCADE,
      link_type TEXT NOT NULL DEFAULT 'related_to',
      notes TEXT NOT NULL DEFAULT ''
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS spec_history (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL REFERENCES specifications(id) ON DELETE CASCADE,
      snapshot TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      change_summary TEXT NOT NULL DEFAULT ''
    );
  `);
}

function parseSpec(row: SpecificationRow): Specification {
  return {
    ...row,
    tags: JSON.parse(row.tags || "[]"),
  };
}

export async function getProjects(): Promise<Project[]> {
  const db = await getDb();
  return db.select<Project[]>(
    "SELECT * FROM projects ORDER BY name ASC"
  );
}

export async function createProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO projects (id, name, description, prefix, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [project.id, project.name, project.description, project.prefix, project.created_at, project.updated_at]
  );
}

export async function updateProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE projects SET name=?, description=?, prefix=?, updated_at=? WHERE id=?",
    [project.name, project.description, project.prefix, project.updated_at, project.id]
  );
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM projects WHERE id=?", [id]);
}

export async function getSpecifications(projectId: string): Promise<Specification[]> {
  const db = await getDb();
  const rows = await db.select<SpecificationRow[]>(
    "SELECT * FROM specifications WHERE project_id=? ORDER BY spec_id ASC",
    [projectId]
  );
  return rows.map(parseSpec);
}

export async function createSpecification(spec: Specification): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO specifications
      (id, spec_id, project_id, type, category, title, description, acceptance_criteria, status, priority, tags, version, notes, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      spec.id, spec.spec_id, spec.project_id, spec.type, spec.category,
      spec.title, spec.description, spec.acceptance_criteria, spec.status,
      spec.priority, JSON.stringify(spec.tags), spec.version, spec.notes,
      spec.created_at, spec.updated_at,
    ]
  );
}

export async function updateSpecification(spec: Specification): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE specifications SET
      type=?, category=?, title=?, description=?, acceptance_criteria=?,
      status=?, priority=?, tags=?, version=?, notes=?, updated_at=?
     WHERE id=?`,
    [
      spec.type, spec.category, spec.title, spec.description,
      spec.acceptance_criteria, spec.status, spec.priority,
      JSON.stringify(spec.tags), spec.version, spec.notes,
      spec.updated_at, spec.id,
    ]
  );
}

export async function deleteSpecification(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM specifications WHERE id=?", [id]);
}

export async function getSpecLinks(specId: string): Promise<SpecLink[]> {
  const db = await getDb();
  return db.select<SpecLink[]>(
    "SELECT * FROM spec_links WHERE source_id=? OR target_id=?",
    [specId, specId]
  );
}

export async function createSpecLink(link: SpecLink): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO spec_links (id, source_id, target_id, link_type, notes) VALUES (?,?,?,?,?)",
    [link.id, link.source_id, link.target_id, link.link_type, link.notes]
  );
}

export async function deleteSpecLink(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM spec_links WHERE id=?", [id]);
}

export async function getSpecHistory(specId: string): Promise<SpecHistory[]> {
  const db = await getDb();
  const rows = await db.select<Array<{ id: string; spec_id: string; snapshot: string; changed_at: string; change_summary: string }>>(
    "SELECT * FROM spec_history WHERE spec_id=? ORDER BY changed_at DESC",
    [specId]
  );
  return rows.map(r => ({ ...r, snapshot: JSON.parse(r.snapshot) }));
}

export async function saveSpecHistory(
  specId: string,
  snapshot: Specification,
  summary: string
): Promise<void> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.execute(
    "INSERT INTO spec_history (id, spec_id, snapshot, changed_at, change_summary) VALUES (?,?,?,?,?)",
    [id, specId, JSON.stringify(snapshot), new Date().toISOString(), summary]
  );
}

export async function getNextSpecId(
  projectId: string,
  prefix: string,
  type: "functional" | "non_functional"
): Promise<string> {
  const db = await getDb();
  const typePrefix = type === "functional" ? "FR" : "NFR";
  const pattern = `${typePrefix}-${prefix}-%`;
  const rows = await db.select<Array<{ spec_id: string }>>(
    "SELECT spec_id FROM specifications WHERE project_id=? AND spec_id LIKE ? ORDER BY spec_id DESC LIMIT 1",
    [projectId, pattern]
  );
  if (rows.length === 0) {
    return `${typePrefix}-${prefix}-001`;
  }
  const last = rows[0].spec_id;
  const num = parseInt(last.split("-").pop() || "0", 10);
  return `${typePrefix}-${prefix}-${String(num + 1).padStart(3, "0")}`;
}
