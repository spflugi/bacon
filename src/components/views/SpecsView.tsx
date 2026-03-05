import { useState } from "react";
import { SpecList } from "@/components/specs/SpecList";
import { SpecEditor } from "@/components/specs/SpecEditor";
import { SpecDetail } from "@/components/specs/SpecDetail";
import { useSpecStore } from "@/store/specStore";

export function SpecsView() {
  const { activeSpecId, setActive } = useSpecStore();
  // editorSpecId: string = editing existing, "" = creating new, null = not open
  const [editorSpecId, setEditorSpecId] = useState<string | null>(null);
  const isEditorOpen = editorSpecId !== null;

  function openNew() {
    setEditorSpecId("");
    setActive(null);
  }

  function openEdit(id: string) {
    setEditorSpecId(id);
  }

  function closeEditor() {
    setEditorSpecId(null);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: spec list */}
      <div
        className={`flex flex-col border-r border-[var(--color-border)] overflow-hidden transition-all ${
          isEditorOpen
            ? "w-0 overflow-hidden opacity-0 pointer-events-none"
            : activeSpecId
            ? "w-[55%]"
            : "flex-1"
        }`}
      >
        <SpecList onNew={openNew} />
      </div>

      {/* Right: detail or editor */}
      {isEditorOpen ? (
        <div className="flex-1 overflow-hidden">
          <SpecEditor
            specId={editorSpecId || null}
            onClose={closeEditor}
          />
        </div>
      ) : activeSpecId ? (
        <div className="flex-1 overflow-hidden">
          <SpecDetail specId={activeSpecId} onEdit={openEdit} onClose={() => setActive(null)} />
        </div>
      ) : null}
    </div>
  );
}
