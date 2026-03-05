import type { Project, Specification, SpecLink } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function linkTypeLabel(t: SpecLink["link_type"]): string {
  return t.replace(/_/g, " ");
}

export function exportToMarkdown(
  project: Project,
  specs: Specification[],
  links: SpecLink[]
): string {
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const functional = specs.filter((s) => s.type === "functional");
  const nonFunctional = specs.filter((s) => s.type === "non_functional");

  const lines: string[] = [];

  lines.push(`# ${project.name} — Specification Document`);
  lines.push(`> Generated: ${now} | Total specs: ${specs.length} | Project prefix: ${project.prefix}`);
  lines.push("");

  if (project.description) {
    lines.push(`## Overview`);
    lines.push(project.description);
    lines.push("");
  }

  // Summary table
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

  function renderSpec(spec: Specification) {
    const specLinks = links.filter(
      (l) => l.source_id === spec.id || l.target_id === spec.id
    );

    lines.push(`### ${spec.spec_id} — ${spec.title}`);
    lines.push("");
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| **ID** | \`${spec.spec_id}\` |`);
    lines.push(`| **Type** | ${spec.type === "functional" ? "Functional" : "Non-Functional"} |`);
    lines.push(`| **Category** | ${spec.category} |`);
    lines.push(`| **Status** | ${spec.status.charAt(0).toUpperCase() + spec.status.slice(1)} |`);
    lines.push(`| **Priority** | ${spec.priority.charAt(0).toUpperCase() + spec.priority.slice(1)} |`);
    lines.push(`| **Version** | ${spec.version} |`);
    lines.push(`| **Created** | ${formatDate(spec.created_at)} |`);
    lines.push(`| **Last Modified** | ${formatDate(spec.updated_at)} |`);
    if (spec.tags.length > 0) {
      lines.push(`| **Tags** | ${spec.tags.map((t) => `\`${t}\``).join(", ")} |`);
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
      lines.push(spec.acceptance_criteria);
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

    lines.push("---");
    lines.push("");
  }

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
