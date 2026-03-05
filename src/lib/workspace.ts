import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import type { Project, Specification, SpecLink, SpecStatus } from "@/types";
import { exportToMarkdown } from "@/lib/export";
import { getSpecLinks } from "@/lib/db";

export const SPEC_FILENAME = "SPECS.md";

// Prevent the poll from reacting to Bacon's own writes (or pending writes)
let _isBaconWriting = false;

/** Call this as soon as a write is scheduled so the poll is suppressed immediately. */
export function markWritePending() {
  _isBaconWriting = true;
}

/** Release the write-pending lock (call when a pending write is cancelled). */
export function resetWritePending() {
  _isBaconWriting = false;
}

export interface StatusChange {
  spec_id: string;
  status: SpecStatus;
}

/** Collect all spec links across all specs, deduped. */
export async function getAllSpecLinks(specs: Specification[]): Promise<SpecLink[]> {
  const all: SpecLink[] = [];
  const seen = new Set<string>();
  for (const spec of specs) {
    const links = await getSpecLinks(spec.id);
    for (const l of links) {
      if (!seen.has(l.id)) {
        seen.add(l.id);
        all.push(l);
      }
    }
  }
  return all;
}

/** Write the spec markdown file into the linked workspace directory. */
export async function writeWorkspaceSpec(
  project: Project,
  specs: Specification[],
  links: SpecLink[]
): Promise<void> {
  if (!project.workspace_path) return;
  const path = `${project.workspace_path}/${SPEC_FILENAME}`;
  const content = exportToMarkdown(project, specs, links);
  _isBaconWriting = true;
  try {
    await writeTextFile(path, content);
  } finally {
    // Hold the flag long enough for the OS watcher event to arrive and be skipped
    setTimeout(() => {
      _isBaconWriting = false;
    }, 1500);
  }
}

/**
 * Parse status changes from a spec file.
 * Returns only entries where the file status differs from the DB status.
 */
export function parseStatusChanges(
  content: string,
  currentSpecs: Specification[]
): StatusChange[] {
  const validStatuses: SpecStatus[] = ["draft", "approved", "implemented", "deprecated"];
  // Each spec block starts with: <!-- bacon:spec:FR-APP-001 -->
  const specCommentRe = /<!-- bacon:spec:([\w-]+) -->/g;
  // Status line: **Status:** `implemented`
  const statusRe = /\*\*Status:\*\*\s+`(\w+)`/;

  const changes: StatusChange[] = [];
  const matches = [...content.matchAll(specCommentRe)];

  for (let i = 0; i < matches.length; i++) {
    const specId = matches[i][1];
    const blockStart = (matches[i].index ?? 0) + matches[i][0].length;
    const blockEnd = matches[i + 1]?.index ?? content.length;
    const block = content.slice(blockStart, blockEnd);

    const statusMatch = block.match(statusRe);
    if (!statusMatch) continue;

    const status = statusMatch[1] as SpecStatus;
    if (!validStatuses.includes(status)) continue;

    const spec = currentSpecs.find((s) => s.spec_id === specId);
    if (!spec || spec.status === status) continue;

    changes.push({ spec_id: specId, status });
  }

  return changes;
}

/**
 * Poll SPECS.md every 2 seconds for status changes made by the agent.
 * Returns a stop function. Synchronous — starts immediately.
 */
export function watchWorkspaceSpec(
  workspacePath: string,
  onChanges: (changes: StatusChange[]) => void,
  getSpecs: () => Specification[]
): () => void {
  const specFilePath = `${workspacePath}/${SPEC_FILENAME}`;

  const poll = async () => {
    if (_isBaconWriting) return;
    try {
      const content = await readTextFile(specFilePath);
      const changes = parseStatusChanges(content, getSpecs());
      if (changes.length > 0) onChanges(changes);
    } catch {
      // File may not exist yet — ignore
    }
  };

  const intervalId = setInterval(poll, 2000);
  return () => clearInterval(intervalId);
}

// Markers used to find/replace the Bacon section in CLAUDE.md
const BACON_SECTION_START = "<!-- bacon:workspace:start -->";
const BACON_SECTION_END = "<!-- bacon:workspace:end -->";

function buildBaconSection(project: Project): string {
  return [
    BACON_SECTION_START,
    `## Bacon Workspace`,
    ``,
    `This workspace is linked to the **${project.name}** project in Bacon.`,
    `The file \`${SPEC_FILENAME}\` contains all project specifications.`,
    ``,
    `### How to update spec status`,
    ``,
    `When you implement a specification, find its block in \`${SPEC_FILENAME}\` and change`,
    `the \`**Status:**\` field to \`\`implemented\`\`:`,
    ``,
    `\`\`\``,
    `**Status:** \`implemented\``,
    `\`\`\``,
    ``,
    `Valid status values: \`draft\` · \`approved\` · \`implemented\` · \`deprecated\``,
    ``,
    `Do **not** remove or modify the \`<!-- bacon:spec:... -->\` comment markers —`,
    `Bacon uses them to detect and sync your changes back to its database.`,
    BACON_SECTION_END,
  ].join("\n");
}

/** Create or update CLAUDE.md in the workspace with Bacon instructions. */
export async function updateClaudeMd(
  workspacePath: string,
  project: Project
): Promise<void> {
  const claudeMdPath = `${workspacePath}/CLAUDE.md`;
  const baconSection = buildBaconSection(project);

  let existing = "";
  try {
    existing = await readTextFile(claudeMdPath);
  } catch {
    // File doesn't exist yet — we'll create it
  }

  let updated: string;
  if (!existing) {
    updated = baconSection + "\n";
  } else if (existing.includes(BACON_SECTION_START)) {
    const startIdx = existing.indexOf(BACON_SECTION_START);
    const endIdx = existing.indexOf(BACON_SECTION_END);
    if (endIdx === -1) {
      // Malformed: replace from start marker to end of file
      updated = existing.slice(0, startIdx) + baconSection + "\n";
    } else {
      updated =
        existing.slice(0, startIdx) +
        baconSection +
        existing.slice(endIdx + BACON_SECTION_END.length);
    }
  } else {
    // Append Bacon section to existing file
    updated = existing.trimEnd() + "\n\n" + baconSection + "\n";
  }

  await writeTextFile(claudeMdPath, updated);
}
