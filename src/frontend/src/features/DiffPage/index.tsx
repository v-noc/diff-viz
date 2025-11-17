import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Branches } from "../../type";
import DiffPageHeader from "./components/DiffPageHeader";
import RepoPathInfo from "./components/RepoPathInfo";
import BranchSelect from "./components/BranchSelect";
import ProjectTree from "./ProjectTree/ProjectTree";
import type { ProjectTreeNode } from "./ProjectTree/types";
import { fetchDiffTree } from "../../services/diifs";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface DiffPageProps {
  repoPath: string;
  onBack: () => void;
  branches: Branches[];
}

const DiffPage: FC<DiffPageProps> = ({ repoPath, onBack, branches }) => {
  const currentBranch = branches.find((b) => b.is_default);

  const [baseBranch, setBaseBranch] = useState(
    currentBranch?.name ?? branches[0]?.name ?? ""
  );
  const [compareBranch, setCompareBranch] = useState(
    branches.find((b) => b.is_current || !b.is_default)?.name ??
      branches[0]?.name ??
      ""
  );

  const [treeNodes, setTreeNodes] = useState<ProjectTreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ProjectTreeNode | null>(
    null
  );
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [treeMode, setTreeMode] = useState<"flat" | "tree">("flat");

  useEffect(() => {
    if (!repoPath || !baseBranch || !compareBranch) return;
    let isCancelled = false;

    Promise.resolve()
      .then(() => {
        if (isCancelled) return;
        setIsLoadingDiff(true);
        setDiffError(null);
        return fetchDiffTree(repoPath, baseBranch, compareBranch, treeMode);
      })
      .then((data) => {
        if (isCancelled) return;
        setTreeNodes(data ?? []);
        if (data && data.length > 0) {
          setSelectedNode(data[0]);
        } else {
          setSelectedNode(null);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load diff tree.";
        setDiffError(message);
        setTreeNodes([]);
        setSelectedNode(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingDiff(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [repoPath, baseBranch, compareBranch, treeMode]);

  const diffText = selectedNode?.source ?? "";

  const diffFile = useMemo(() => {
    if (!diffText) return null;
    try {
      const files = parseDiff(diffText);
      return files[0] ?? null;
    } catch {
      return null;
    }
  }, [diffText]);

  const selectedPath = selectedNode?.path || selectedNode?.label || "";

  const handleSwapBranches = () => {
    if (!baseBranch || !compareBranch) return;
    setBaseBranch(compareBranch);
    setCompareBranch(baseBranch);
  };

  const handleViewModeChange = (mode: "flat" | "tree") => {
    setTreeMode(mode);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="mx-auto flex w-full  flex-1 flex-col px-4 py-6 md:px-8 overflow-hidden">
        <header className="border-b pb-1">
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
              <div className="flex flex-col ">
                <div className="flex flex-wrap items-start justify-between">
                  <BranchSelect
                    label="Base branch"
                    branches={branches}
                    value={baseBranch || undefined}
                    onChange={setBaseBranch}
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    className="mt-6"
                    onClick={handleSwapBranches}
                    aria-label="Swap base and compare branches"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  <BranchSelect
                    label="Compare branch"
                    branches={branches}
                    value={compareBranch || undefined}
                    onChange={setCompareBranch}
                  />
                </div>
                <RepoPathInfo repoPath={repoPath} />
              </div>
              <div className="flex flex-1 min-h-0 flex-col rounded-lg border bg-card/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Diff
                    {baseBranch && compareBranch && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({baseBranch} → {compareBranch})
                      </span>
                    )}
                  </p>
                  {selectedPath && (
                    <span className="text-xs text-muted-foreground">
                      {selectedPath}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the dropdowns above to choose the base and compare
                  branches.
                </p>
                {isLoadingDiff && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Loading diff tree…
                  </p>
                )}
                {diffError && (
                  <p className="mt-1 text-xs text-red-500">{diffError}</p>
                )}
                {diffFile ? (
                  <div className="mt-4 flex-1 overflow-hidden rounded-md border bg-background text-xs">
                    <div className="h-full overflow-auto">
                      <Diff
                        viewType="split"
                        diffType={diffFile.type}
                        hunks={diffFile.hunks}
                      >
                        {(hunks) =>
                          hunks.map((hunk) => (
                            <Hunk key={hunk.content} hunk={hunk} />
                          ))
                        }
                      </Diff>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                    Diff preview will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DiffPage;
