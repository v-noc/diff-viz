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

  useEffect(() => {
    if (!repoPath || !baseBranch || !compareBranch) return;

    let isCancelled = false;
    setIsLoadingDiff(true);
    setDiffError(null);

    fetchDiffTree(repoPath, baseBranch, compareBranch)
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
  }, [repoPath, baseBranch, compareBranch]);

  const diffText = selectedNode?.source ?? "";

  const diffFile = useMemo(() => {
    if (!diffText) return null;
    try {
      console.log(diffText);
      const files = parseDiff(diffText);
      return files[0] ?? null;
    } catch {
      return null;
    }
  }, [diffText]);

  const selectedPath = selectedNode?.path || selectedNode?.label || "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8">
        <header className="border-b pb-4">
          <DiffPageHeader
            onBack={onBack}
            currentBranchName={currentBranch?.name}
          />
        </header>

        <main className="flex-1 py-4">
          <div className="flex h-full gap-4">
            <aside className="hidden w-72 shrink-0 md:block">
              <ProjectTree
                nodes={treeNodes}
                selectedId={selectedNode?.id ?? null}
                onSelectNode={setSelectedNode}
              />
            </aside>

            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <BranchSelect
                    label="Base branch"
                    branches={branches}
                    value={baseBranch || undefined}
                    onChange={setBaseBranch}
                  />
                  <RepoPathInfo repoPath={repoPath} />
                </div>
                <BranchSelect
                  label="Compare branch"
                  branches={branches}
                  value={compareBranch || undefined}
                  onChange={setCompareBranch}
                />
              </div>

              <div className="flex min-h-[260px] flex-col rounded-lg border bg-card/50 p-4 md:min-h-[420px]">
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
