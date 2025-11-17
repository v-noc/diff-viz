import type { FC } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FunctionSquare,
  LayoutPanelTop,
  AlertTriangle,
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

const formatNodeLabel = (label: string): string => {
  if (!label || typeof label !== "string") {
    return "";
  }

  // Get the last part of the path
  const parts = label.split("/");
  const lastPart = parts[parts.length - 1] || "";

  // Truncate if too long
  const maxLength = 25;
  if (lastPart.length > maxLength) {
    return lastPart.slice(0, maxLength) + "...";
  }

  return lastPart;
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
        {hasChildren &&
          (isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ))}
        {getIcon(node)}
        <span className="truncate">{formatNodeLabel(node.label)}</span>
      </span>
      <span className="flex items-center gap-1">
        {node.has_conflict && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 px-1.5 py-0 text-[9px]"
          >
            <AlertTriangle className="h-3 w-3" />
            Conflict
          </Badge>
        )}
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
      </span>
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
