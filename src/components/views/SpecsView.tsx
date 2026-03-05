import { useState } from "react";
import { SpecList } from "@/components/specs/SpecList";
import { SpecEditor } from "@/components/specs/SpecEditor";

export function SpecsView() {
  // editorSpecId: string = editing existing, "" = creating new, null = not open
  const [editorSpecId, setEditorSpecId] = useState<string | null>(null);
  const isEditorOpen = editorSpecId !== null;

  function openNew() {
    setEditorSpecId("");
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
          isEditorOpen ? "w-0 overflow-hidden opacity-0 pointer-events-none" : "flex-1"
        }`}
      >
        <SpecList onNew={openNew} onEdit={openEdit} />
      </div>

      {/* Right: editor */}
      {isEditorOpen && (
        <div className="flex-1 overflow-hidden">
          <SpecEditor specId={editorSpecId || null} onClose={closeEditor} />
        </div>
      )}
    </div>
  );
}
