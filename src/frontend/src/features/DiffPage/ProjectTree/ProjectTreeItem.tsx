import type { FC } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FunctionSquare,
  LayoutPanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ProjectTreeNode } from "./types";

interface ProjectTreeItemProps {
  node: ProjectTreeNode;
  level?: number;
  expandedIds: Set<string>;
  selectedId?: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: ProjectTreeNode) => void;
}
const getIcon = (node: ProjectTreeNode) => {
  switch (node.kind) {
    case "folder":
      return <Folder className="h-3 w-3 text-muted-foreground" />;
    case "file":
      return <FileText className="h-3 w-3 text-muted-foreground" />;
    case "function":
      return <FunctionSquare className="h-3 w-3 text-muted-foreground" />;
    case "class":
      return <LayoutPanelTop className="h-3 w-3 text-muted-foreground" />;
  }
};
const statusToVariant: Record<
  NonNullable<ProjectTreeNode["status"]>,
  "default" | "secondary" | "destructive" | "outline"
> = {
  added: "default",
  removed: "destructive",
  modified: "secondary",
  unchanged: "outline",
};

const statusToLabel: Record<NonNullable<ProjectTreeNode["status"]>, string> = {
  added: "Added",
  removed: "Removed",
  modified: "Modified",
  unchanged: "Unchanged",
};

const ProjectTreeItem: FC<ProjectTreeItemProps> = ({
  node,
  level = 0,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
}) => {
  const hasChildren = !!node.children?.length;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const leftPadding = 8 + level * 12;

  const handleClick = () => {
    onSelect(node);
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  const header = (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2 py-1 text-xs transition-colors",
        level === 0 ? "font-medium" : "font-normal",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/80 text-foreground"
      )}
      style={{ paddingLeft: leftPadding }}
    >
      <span className="flex items-center gap-2">
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )
        ) : (
          getIcon(node)
        )}
        <span className="truncate">
          {node.label.length > 25
            ? node.label.slice(0, 25) + "..."
            : node.label}
        </span>
      </span>
      {node.status && (
        <Badge
          variant={statusToVariant[node.status]}
          className={cn(
            "text-[10px]",
            node.status === "added" && "bg-emerald-500/15 text-emerald-700",
            node.status === "removed" && "bg-red-500/10",
            node.status === "modified" && "bg-amber-500/10 text-amber-700"
          )}
        >
          {statusToLabel[node.status]}
        </Badge>
      )}
    </button>
  );

  return (
    <div className={cn(level === 0 && "mb-2 rounded-lg border bg-muted/40")}>
      {header}
      {hasChildren && isExpanded && (
        <div className="pb-1">
          {node.children?.map((child) => (
            <ProjectTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTreeItem;
