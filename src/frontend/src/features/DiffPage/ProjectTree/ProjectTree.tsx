import type { FC } from "react";
import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ProjectTreeItem from "./ProjectTreeItem";
import type { ProjectTreeNode } from "./types";
import { demoProjectTree } from "./demoData";

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
  className?: string;
}

const ProjectTree: FC<ProjectTreeProps> = ({
  nodes,
  selectedId: controlledSelectedId,
  onSelectNode,
  className,
}) => {
  const treeData = nodes && nodes.length > 0 ? nodes : demoProjectTree;

  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState<
    string | null
  >(treeData[0]?.id ?? null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    treeData.forEach((node) => initial.add(node.id));
    return initial;
  });

  const selectedId = controlledSelectedId ?? uncontrolledSelectedId;

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

  const flatCount = useMemo(() => {
    const walk = (items: ProjectTreeNode[]): number =>
      items.reduce(
        (acc, item) => acc + 1 + (item.children ? walk(item.children) : 0),
        0
      );
    return walk(treeData);
  }, [treeData]);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border bg-card/80",
        className
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          Function/Class changes
        </p>
        <span className="text-[10px] text-muted-foreground">{flatCount}</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          {treeData.map((node) => (
            <ProjectTreeItem
              key={node.id}
              node={node}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectTree;


