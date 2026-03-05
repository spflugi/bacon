import { useEffect, useState } from "react";
import { Sidebar, type View } from "@/components/projects/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { SpecsView } from "@/components/views/SpecsView";
import { ExportView } from "@/components/views/ExportView";
import { useProjectStore } from "@/store/projectStore";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const { load } = useProjectStore();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      <Sidebar view={view} onViewChange={setView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === "dashboard" && <DashboardView />}
        {view === "specs" && <SpecsView />}
        {view === "export" && <ExportView />}
      </main>
    </div>
  );
}
