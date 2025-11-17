import type { FC } from "react";
import { useMemo, useState } from "react";
import type { Branches } from "../../type";
import type { ProjectTreeNode } from "./ProjectTree/types";
import DiffPageHeader from "./components/DiffPageHeader";
import ProjectTree from "./ProjectTree/ProjectTree";
import BranchSelectionSection from "./components/BranchSelectionSection";
import DiffViewerSection from "./components/DiffViewerSection";
import { useDiffTree, useBranchDefaults } from "./hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface DiffPageProps {
  repoPath: string;
  onBack: () => void;
  branches: Branches[];
}

const DiffPage: FC<DiffPageProps> = ({ repoPath, onBack, branches }) => {
  const currentBranch = branches.find((b) => b.is_default);

  const { baseBranch, compareBranch, setBaseBranch, setCompareBranch } =
    useBranchDefaults(branches);

  const {
    treeNodes,
    isLoading: isLoadingDiff,
    error: diffError,
  } = useDiffTree({
    repoPath,
    baseBranch,
    compareBranch,
  });

  const [selectedNode, setSelectedNode] = useState<ProjectTreeNode | null>(
    treeNodes.length > 0 ? treeNodes[0] : null
  );
  const [treeMode, setTreeMode] = useState<"flat" | "tree">("flat");
  const [diffViewerType, setDiffViewerType] = useState<
    "monaco" | "react-diff-view"
  >("monaco");

  const conflictCount = useMemo(() => {
    const walk = (nodes: ProjectTreeNode[]): number =>
      nodes.reduce(
        (acc, node) =>
          acc +
          (node.has_conflict ? 1 : 0) +
          (node.children ? walk(node.children) : 0),
        0
      );
    return walk(treeNodes);
  }, [treeNodes]);

  const selectedHasConflict = !!selectedNode?.has_conflict;

  // Update selected node when tree nodes change
  if (treeNodes.length > 0 && !selectedNode) {
    setSelectedNode(treeNodes[0]);
  } else if (treeNodes.length === 0 && selectedNode) {
    setSelectedNode(null);
  }

  const handleSwapBranches = () => {
    if (!baseBranch || !compareBranch) return;
    setBaseBranch(compareBranch);
    setCompareBranch(baseBranch);
  };

  const handleViewModeChange = (mode: "flat" | "tree") => {
    setTreeMode(mode);
  };

  const handleDiffViewerChange = () => {
    setDiffViewerType(
      diffViewerType === "monaco" ? "react-diff-view" : "monaco"
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="mx-auto flex w-full flex-1 flex-col px-4 py-6 md:px-8 overflow-hidden">
        <header className="border-b pb-4">
          <DiffPageHeader
            onBack={onBack}
            currentBranchName={currentBranch?.name}
          />
        </header>

        <main className="flex-1 py-4 overflow-hidden">
          <div className="flex h-full gap-4 overflow-hidden">
            <aside className="hidden h-full w-72 shrink-0 flex-col md:flex">
              <ProjectTree
                nodes={treeNodes}
                selectedId={selectedNode?.id ?? null}
                onSelectNode={setSelectedNode}
                isLoading={isLoadingDiff}
                viewMode={treeMode}
                onViewModeChange={handleViewModeChange}
                emptyMessage={
                  baseBranch && compareBranch
                    ? "No function or class changes found between these branches."
                    : "Select branches to see function and class changes."
                }
              />
            </aside>

            <div className="flex flex-1 flex-col gap-4">
              <BranchSelectionSection
                branches={branches}
                baseBranch={baseBranch}
                compareBranch={compareBranch}
                onBaseBranchChange={setBaseBranch}
                onCompareBranchChange={setCompareBranch}
                onSwapBranches={handleSwapBranches}
                repoPath={repoPath}
              />

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Diff Viewer
                    </p>
                    {conflictCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px]"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>
                          {conflictCount} conflict
                          {conflictCount > 1 ? "s" : ""}
                        </span>
                      </Badge>
                    )}
                    {selectedHasConflict && (
                      <span className="hidden items-center gap-1 text-[11px] text-destructive sm:inline-flex">
                        <AlertTriangle className="h-3 w-3" />
                        Conflict in selected item
                      </span>
                    )}
                  </div>
                  <Button
                    variant={selectedHasConflict ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleDiffViewerChange}
                    className="text-xs"
                  >
                    {diffViewerType === "monaco"
                      ? "Switch to React Diff View"
                      : "Switch to Monaco"}
                  </Button>
                </div>
                {selectedHasConflict && (
                  <p className="text-[11px] text-muted-foreground sm:hidden">
                    <span className="font-medium text-destructive">
                      Conflict
                    </span>{" "}
                    detected in the selected item. Review and resolve the
                    changes below.
                  </p>
                )}
              </div>

              <DiffViewerSection
                selectedNode={selectedNode}
                baseBranch={baseBranch}
                compareBranch={compareBranch}
                isLoading={isLoadingDiff}
                error={diffError}
                viewerType={diffViewerType}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DiffPage;
