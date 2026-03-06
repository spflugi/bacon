import { useEffect, useState } from "react";
import { Sidebar, type View } from "@/components/projects/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { SpecsView } from "@/components/views/SpecsView";
import { useProjectStore } from "@/store/projectStore";
import { useWorkspaceSync } from "@/hooks/useWorkspaceSync";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const { load } = useProjectStore();

  useEffect(() => {
    load();
  }, [load]);

  useWorkspaceSync();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      <Sidebar view={view} onViewChange={setView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === "dashboard" && <DashboardView />}
        {view === "specs" && <SpecsView />}
      </main>
    </div>
  );
}
