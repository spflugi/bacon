import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { useSpecStore } from "@/store/specStore";
import { exportToMarkdown } from "@/lib/export";
import { getSpecLinks } from "@/lib/db";
import type { SpecLink } from "@/types";

export function ExportView() {
  const { activeProjectId, projects } = useProjectStore();
  const { specs, load } = useSpecStore();
  const project = projects.find((p) => p.id === activeProjectId);
  const [links, setLinks] = useState<SpecLink[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeProjectId) {
      load(activeProjectId);
    }
  }, [activeProjectId, load]);

  useEffect(() => {
    async function loadAllLinks() {
      const all: SpecLink[] = [];
      const seen = new Set<string>();
      for (const spec of specs) {
        const specLinks = await getSpecLinks(spec.id);
        for (const l of specLinks) {
          if (!seen.has(l.id)) {
            seen.add(l.id);
            all.push(l);
          }
        }
      }
      setLinks(all);
    }
    if (specs.length > 0) loadAllLinks();
    else setLinks([]);
  }, [specs]);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-muted-foreground)] text-sm">
        Select a project to export.
      </div>
    );
  }

  const markdown = exportToMarkdown(project, specs, links);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-base font-semibold">Export — {project.name}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {specs.length} specification{specs.length !== 1 ? "s" : ""} · Markdown format
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <pre className="text-xs text-[var(--color-foreground)] font-mono whitespace-pre-wrap bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 leading-relaxed">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
