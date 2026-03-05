import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpecStore } from "@/store/specStore";

export function SpecFilters() {
  const { filters, setFilters } = useSpecStore();

  const hasActive =
    filters.search ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.tag;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
        <Input
          className="pl-8 h-8 text-xs"
          placeholder="Search specs..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
        />
      </div>

      <Select
        value={filters.type}
        onValueChange={(v) => setFilters({ type: v as typeof filters.type })}
      >
        <SelectTrigger className="h-8 text-xs w-40">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="functional">Functional</SelectItem>
          <SelectItem value="non_functional">Non-Functional</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) => setFilters({ status: v as typeof filters.status })}
      >
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="implemented">Implemented</SelectItem>
          <SelectItem value="deprecated">Deprecated</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => setFilters({ priority: v as typeof filters.priority })}
      >
        <SelectTrigger className="h-8 text-xs w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() =>
            setFilters({ search: "", type: "all", status: "all", priority: "all", tag: "" })
          }
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
