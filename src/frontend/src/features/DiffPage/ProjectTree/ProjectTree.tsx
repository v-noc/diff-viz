import type { FC } from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ProjectTreeItem from "./ProjectTreeItem";
import type { ProjectTreeNode } from "./types";
import { Toggle } from "@/components/ui/toggle";
import { FolderTree } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProjectTreeFilterPopover from "./ProjectTreeFilterPopover";
import { filter as rFilter } from "remeda";

interface ProjectTreeProps {
  /**
   * Tree data. If omitted, a small demo tree is used.
   */
  nodes?: ProjectTreeNode[];
  /**
   * Currently selected node id. If omitted, the component manages its own selection.
   */
  selectedId?: string | null;
  /**
   * Called when a node is clicked. You can use this to sync selection and drive the diff view.
   */
  onSelectNode?: (node: ProjectTreeNode) => void;
  /**
   * Called when view mode changes between flat and tree.
   */
  onViewModeChange?: (mode: "flat" | "tree") => void;
  className?: string;
  /**
   * Whether the tree data is currently loading.
   */
  isLoading?: boolean;
  /**
   * Optional message to show when there are no nodes.
   */
  emptyMessage?: string;
  /**
   * Current view mode for the tree.
   */
  viewMode?: "flat" | "tree";
}

interface FilterState {
  fileTypes: Set<string>;
  modificationTypes: Set<string>;
}

const searchNodesByName = (
  nodes: ProjectTreeNode[],
  query: string
): ProjectTreeNode[] => {
  if (!query.trim()) return nodes;

  const lowerQuery = query.toLowerCase();

  const walk = (items: ProjectTreeNode[]): ProjectTreeNode[] =>
    rFilter(items, (node) => {
      const matches = node.label.toLowerCase().includes(lowerQuery);
      const hasMatchingChildren = node.children
        ? walk(node.children).length > 0
        : false;
      return matches || hasMatchingChildren;
    }).map((node) => ({
      ...node,
      children: node.children ? walk(node.children) : undefined,
    }));

  return walk(nodes);
};

const ProjectTree: FC<ProjectTreeProps> = ({
  nodes,
  selectedId: controlledSelectedId,
  onSelectNode,
  onViewModeChange,
  className,
  isLoading,
  emptyMessage,
  viewMode: controlledViewMode,
}) => {
  const treeData = useMemo(
    () => (nodes && nodes.length > 0 ? nodes : []),
    [nodes]
  );

  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState<
    string | null
  >(treeData[0]?.id ?? null);

  const [uncontrolledViewMode, setUncontrolledViewMode] = useState<
    "flat" | "tree"
  >("flat");

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    treeData.forEach((node) => initial.add(node.id));

    return initial;
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    fileTypes: new Set(),
    modificationTypes: new Set(),
  });

  const selectedId = controlledSelectedId ?? uncontrolledSelectedId;
  const viewMode = controlledViewMode ?? uncontrolledViewMode;

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (node: ProjectTreeNode) => {
    if (!controlledSelectedId) {
      setUncontrolledSelectedId(node.id);
    }
    onSelectNode?.(node);
  };

  const handleViewModeChange = (mode: "flat" | "tree") => {
    if (!controlledViewMode) {
      setUncontrolledViewMode(mode);
    }
    onViewModeChange?.(mode);
  };

  // Get file extensions from all nodes
  const fileExtensions = useMemo(() => {
    const exts = new Map<string, number>();

    const walk = (items: ProjectTreeNode[]) => {
      items.forEach((node) => {
        if (node.kind === "file" && node.path) {
          const ext =
            node.path.substring(node.path.lastIndexOf(".")) || "no-ext";
          exts.set(ext, (exts.get(ext) ?? 0) + 1);
        }
        if (node.children) walk(node.children);
      });
    };

    walk(treeData);
    return exts;
  }, [treeData]);

  // Get modification types from all nodes
  const modificationTypesData = useMemo(() => {
    const types = new Map<string, number>();

    const walk = (items: ProjectTreeNode[]) => {
      items.forEach((node) => {
        if (node.status) {
          types.set(node.status, (types.get(node.status) ?? 0) + 1);
        }
        if (node.children) walk(node.children);
      });
    };

    walk(treeData);
    return types;
  }, [treeData]);

  // Apply search and filters
  const filteredData = useMemo(() => {
    let result = treeData;

    // Apply search
    if (debouncedQuery) {
      result = searchNodesByName(result, debouncedQuery);
    }

    // Apply filters
    if (filters.fileTypes.size > 0 || filters.modificationTypes.size > 0) {
      const walk = (items: ProjectTreeNode[]): ProjectTreeNode[] =>
        rFilter(items, (node) => {
          // Initialize matches based on whether filters are active
          let fileTypeMatch = filters.fileTypes.size === 0; // True if no file type filter
          let modTypeMatch = filters.modificationTypes.size === 0; // True if no mod type filter

          // Check file type filter - only applies to files
          if (filters.fileTypes.size > 0 && node.kind === "file" && node.path) {
            const ext =
              node.path.substring(node.path.lastIndexOf(".")) || "no-ext";
            fileTypeMatch = filters.fileTypes.has(ext);
          } else if (filters.fileTypes.size > 0) {
            // Non-file nodes don't match file type filter directly
            // They will be included only if they have matching children
            fileTypeMatch = false;
          }

          // Check modification type filter - only applies to nodes with status
          if (filters.modificationTypes.size > 0 && node.status) {
            modTypeMatch = filters.modificationTypes.has(node.status);
          } else if (filters.modificationTypes.size > 0) {
            // Nodes without status don't match modification type filter directly
            modTypeMatch = false;
          }

          const matches = fileTypeMatch && modTypeMatch;
          const hasMatchingChildren = node.children
            ? walk(node.children).length > 0
            : false;
          return matches || hasMatchingChildren;
        }).map((node) => ({
          ...node,
          children: node.children ? walk(node.children) : undefined,
        }));

      result = walk(result);
    }

    return result;
  }, [treeData, debouncedQuery, filters]);

  const flatCount = useMemo(() => {
    const walk = (items: ProjectTreeNode[]): number =>
      items.reduce(
        (acc, item) => acc + 1 + (item.children ? walk(item.children) : 0),
        0
      );
    return walk(filteredData);
  }, [filteredData]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border bg-card/80",
        className
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          Function/Class changes
        </p>
        <span className="text-[10px] text-muted-foreground">
          {isLoading ? "…" : flatCount}
        </span>
      </div>

      <div className="border-b px-3 py-2 flex flex-row gap-1 items-center w-full">
        <Input
          className="w-full"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <ProjectTreeFilterPopover
          fileExtensions={fileExtensions}
          modificationTypes={modificationTypesData}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <Toggle
          size="sm"
          pressed={viewMode === "tree"}
          onPressedChange={(pressed) =>
            handleViewModeChange(pressed ? "tree" : "flat")
          }
          aria-label="Toggle tree view"
          className="data-[state=on]:bg-black data-[state=on]:*:[svg]:stroke-white"
        >
          <FolderTree />
        </Toggle>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 py-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          ) : filteredData.length === 0 ? (
            <p className="px-1 py-1 text-[11px] text-muted-foreground">
              {emptyMessage ??
                "No function or class changes found for this diff."}
            </p>
          ) : (
            filteredData.map((node) => (
              <ProjectTreeItem
                key={node.id}
                node={node}
                expandedIds={expandedIds}
                selectedId={selectedId}
                onToggle={handleToggle}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectTree;
