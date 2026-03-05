import type { Project, Specification, SpecLink } from "@/types";

function isoDate(iso: string) {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function linkTypeLabel(t: SpecLink["link_type"]): string {
  return t.replace(/_/g, " ");
}

/** Normalize acceptance criteria to a bullet list.
 *  Lines that already start with -, *, or a number are left as-is.
 *  Plain text lines get a "- " prefix so each criterion is explicit.
 */
function normalizeCriteria(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const trimmed = line.trim();
      if (/^[-*]/.test(trimmed) || /^\d+\./.test(trimmed)) return line;
      return `- ${trimmed}`;
    })
    .join("\n");
}

/** Escape a string value for YAML (wrap in double quotes, escape inner quotes). */
function yamlStr(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function exportToMarkdown(
  project: Project,
  specs: Specification[],
  links: SpecLink[]
): string {
  const exportedAt = new Date().toISOString();
  const functional = specs.filter((s) => s.type === "functional");
  const nonFunctional = specs.filter((s) => s.type === "non_functional");

  const lines: string[] = [];

  // --- YAML frontmatter ---
  lines.push("---");
  lines.push(`tool: bacon`);
  lines.push(`project: ${yamlStr(project.name)}`);
  lines.push(`prefix: ${project.prefix}`);
  lines.push(`bacon_project_id: ${project.id}`);
  lines.push(`exported_at: ${exportedAt}`);
  lines.push(`spec_count: ${specs.length}`);
  lines.push(`functional_count: ${functional.length}`);
  lines.push(`non_functional_count: ${nonFunctional.length}`);
  lines.push("---");
  lines.push("");

  // --- Document header ---
  lines.push(`# ${project.name} — Specification Document`);
  lines.push("");

  if (project.description) {
    lines.push("## Overview");
    lines.push("");
    lines.push(project.description);
    lines.push("");
  }

  // --- Agent Instructions ---
  lines.push("## Agent Instructions");
  lines.push("");
  lines.push("> This file is managed by **Bacon**. When you implement a specification,");
  lines.push("> change its `**Status:**` field to `` `implemented` ``:");
  lines.push(">");
  lines.push("> ```");
  lines.push("> **Status:** `implemented`");
  lines.push("> ```");
  lines.push(">");
  lines.push("> Valid status values: `draft` · `approved` · `implemented` · `deprecated`");
  lines.push(">");
  lines.push("> Do **not** remove or modify the `<!-- bacon:spec:... -->` comment markers —");
  lines.push("> Bacon uses them to detect and sync status changes back to its database.");
  lines.push("");

  // --- Summary table ---
  lines.push("## Summary");
  lines.push("");
  lines.push("| Type | Total | Draft | Approved | Implemented | Deprecated |");
  lines.push("|------|-------|-------|----------|-------------|------------|");

  function summaryRow(label: string, arr: Specification[]) {
    const d = arr.filter((s) => s.status === "draft").length;
    const a = arr.filter((s) => s.status === "approved").length;
    const i = arr.filter((s) => s.status === "implemented").length;
    const dep = arr.filter((s) => s.status === "deprecated").length;
    lines.push(`| ${label} | ${arr.length} | ${d} | ${a} | ${i} | ${dep} |`);
  }

  summaryRow("Functional", functional);
  summaryRow("Non-Functional", nonFunctional);
  lines.push("");

  // --- Spec renderer ---
  function renderSpec(spec: Specification) {
    const specLinks = links.filter(
      (l) => l.source_id === spec.id || l.target_id === spec.id
    );

    // Machine-readable anchor — used by Bacon's file watcher to find this spec
    lines.push(`<!-- bacon:spec:${spec.spec_id} -->`);
    lines.push(`### ${spec.spec_id} — ${spec.title}`);
    lines.push("");

    // Flat key: value metadata
    lines.push(`**ID:** \`${spec.spec_id}\``);
    lines.push(`**Type:** ${spec.type === "functional" ? "Functional" : "Non-Functional"}`);
    lines.push(`**Category:** ${spec.category}`);
    // Status uses backtick-wrapped lowercase so Bacon can parse it back reliably
    lines.push(`**Status:** \`${spec.status}\``);
    lines.push(`**Priority:** ${spec.priority.charAt(0).toUpperCase() + spec.priority.slice(1)}`);
    lines.push(`**Version:** ${spec.version}`);
    lines.push(`**Created:** ${isoDate(spec.created_at)}`);
    lines.push(`**Last Modified:** ${isoDate(spec.updated_at)}`);
    if (spec.tags.length > 0) {
      lines.push(`**Tags:** ${spec.tags.map((t) => `\`${t}\``).join(", ")}`);
    }
    lines.push("");

    if (spec.description) {
      lines.push("**Description**");
      lines.push("");
      lines.push(spec.description);
      lines.push("");
    }

    if (spec.acceptance_criteria) {
      lines.push("**Acceptance Criteria**");
      lines.push("");
      lines.push(normalizeCriteria(spec.acceptance_criteria));
      lines.push("");
    }

    if (spec.notes) {
      lines.push("**Notes**");
      lines.push("");
      lines.push(spec.notes);
      lines.push("");
    }

    if (specLinks.length > 0) {
      lines.push("**Links**");
      lines.push("");
      for (const link of specLinks) {
        const isSource = link.source_id === spec.id;
        const otherId = isSource ? link.target_id : link.source_id;
        const other = specs.find((s) => s.id === otherId);
        const direction = isSource ? "" : "← ";
        lines.push(
          `- ${direction}${linkTypeLabel(link.link_type)}: \`${other?.spec_id ?? otherId}\` — ${other?.title ?? "(unknown)"}`
        );
      }
      lines.push("");
    }
  }

  // --- Sections ---
  if (functional.length > 0) {
    lines.push("## Functional Requirements");
    lines.push("");
    for (const spec of functional) renderSpec(spec);
  }

  if (nonFunctional.length > 0) {
    lines.push("## Non-Functional Requirements");
    lines.push("");
    for (const spec of nonFunctional) renderSpec(spec);
  }

  return lines.join("\n");
}
