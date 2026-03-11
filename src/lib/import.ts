import type { SpecType, SpecStatus, SpecPriority, LinkType } from "@/types";

export interface ParsedSpec {
  originalSpecId: string;
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
}

export interface ParsedLink {
  sourceOriginalId: string;
  targetOriginalId: string;
  link_type: LinkType;
}

export interface ParsedImport {
  projectName: string;
  projectPrefix: string;
  projectDescription: string;
  specs: ParsedSpec[];
  links: ParsedLink[];
}

const LINK_LABEL_TO_TYPE: Record<string, LinkType> = {
  "depends on": "depends_on",
  "related to": "related_to",
  "conflicts with": "conflicts_with",
  "implements": "implements",
  "extends": "extends",
};

const BOLD_SECTIONS = ["Description", "Acceptance Criteria", "Notes", "Links"];

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error("No YAML frontmatter found — is this a bacon export file?");
  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const raw = line.slice(colonIdx + 1).trim();
    result[key] = raw.startsWith('"') && raw.endsWith('"')
      ? raw.slice(1, -1).replace(/\\(["\\])/g, "$1")
      : raw;
  }
  return result;
}

function extractOverview(content: string): string {
  const m = content.match(/## Overview\n\n([\s\S]*?)(?=\n## )/);
  return m ? m[1].trim() : "";
}

function trimSection(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start++;
  while (end > start && lines[end - 1].trim() === "") end--;
  return lines.slice(start, end).join("\n");
}

function parseBlock(originalSpecId: string, block: string): { spec: ParsedSpec; links: ParsedLink[] } {
  const lines = block.split("\n");

  let title = "";
  let type: SpecType = "functional";
  let category = "";
  let status: SpecStatus = "draft";
  let priority: SpecPriority = "medium";
  let version = 1;
  let tags: string[] = [];

  let currentSection: string | null = null;
  const sections: Record<string, string[]> = {};

  for (const line of lines) {
    // Bold section header: **Name** with nothing else on the line
    const boldHeader = line.match(/^\*\*(.+)\*\*$/);
    if (boldHeader && BOLD_SECTIONS.includes(boldHeader[1])) {
      currentSection = boldHeader[1];
      sections[currentSection] = [];
      continue;
    }

    if (currentSection !== null) {
      sections[currentSection].push(line);
      continue;
    }

    // Metadata lines (appear before any bold section)
    const headerM = line.match(/^### [\w-]+ — (.+)$/);
    if (headerM) { title = headerM[1].trim(); continue; }

    const typeM = line.match(/^\*\*Type:\*\* (.+)/);
    if (typeM) { type = typeM[1].trim() === "Non-Functional" ? "non_functional" : "functional"; continue; }

    const catM = line.match(/^\*\*Category:\*\* (.+)/);
    if (catM) { category = catM[1].trim(); continue; }

    const statusM = line.match(/^\*\*Status:\*\* `(\w+)`/);
    if (statusM) { status = statusM[1] as SpecStatus; continue; }

    const prioM = line.match(/^\*\*Priority:\*\* (.+)/);
    if (prioM) { priority = prioM[1].trim().toLowerCase() as SpecPriority; continue; }

    const verM = line.match(/^\*\*Version:\*\* (\d+)/);
    if (verM) { version = parseInt(verM[1], 10); continue; }

    const tagsM = line.match(/^\*\*Tags:\*\* (.+)/);
    if (tagsM) { tags = [...tagsM[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]); continue; }
  }

  // Parse forward links only (lines without ← are source→target)
  const links: ParsedLink[] = [];
  for (const line of sections["Links"] ?? []) {
    if (line.startsWith("- ←") || !line.startsWith("- ")) continue;
    const m = line.match(/^- (.+?): `([\w-]+)` — /);
    if (!m) continue;
    const linkType = LINK_LABEL_TO_TYPE[m[1].trim()];
    if (!linkType) continue;
    links.push({ sourceOriginalId: originalSpecId, targetOriginalId: m[2], link_type: linkType });
  }

  return {
    spec: {
      originalSpecId,
      type,
      category,
      title,
      description: trimSection(sections["Description"] ?? []),
      acceptance_criteria: trimSection(sections["Acceptance Criteria"] ?? []),
      status,
      priority,
      tags,
      version,
      notes: trimSection(sections["Notes"] ?? []),
    },
    links,
  };
}

export function parseImport(content: string): ParsedImport {
  const fm = parseFrontmatter(content);
  if (fm.tool !== "bacon") throw new Error("Not a bacon export file (expected tool: bacon in frontmatter)");

  const projectName = fm.project ?? "Imported Project";
  const projectPrefix = fm.prefix ?? "SPEC";
  const projectDescription = extractOverview(content);

  const anchorRe = /<!-- bacon:spec:([\w-]+) -->/g;
  const anchorMatches = [...content.matchAll(anchorRe)];

  const specs: ParsedSpec[] = [];
  const links: ParsedLink[] = [];

  for (let i = 0; i < anchorMatches.length; i++) {
    const m = anchorMatches[i];
    const originalSpecId = m[1];
    const blockStart = (m.index ?? 0) + m[0].length;
    const blockEnd = anchorMatches[i + 1]?.index ?? content.length;
    const block = content.slice(blockStart, blockEnd);

    const { spec, links: blockLinks } = parseBlock(originalSpecId, block);
    specs.push(spec);
    links.push(...blockLinks);
  }

  return { projectName, projectPrefix, projectDescription, specs, links };
}
