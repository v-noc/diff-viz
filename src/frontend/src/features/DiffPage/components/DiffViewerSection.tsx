import type { FC } from "react";
import { useMemo } from "react";
import type { ProjectTreeNode } from "../ProjectTree/types";
import MonacoDiffViewer from "./MonacoDiffViewer";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";

interface DiffViewerSectionProps {
  selectedNode: ProjectTreeNode | null;
  baseBranch: string;
  compareBranch: string;
  isLoading: boolean;
  error: string | null;
  viewerType?: "monaco" | "react-diff-view";
}

const DiffViewerSection: FC<DiffViewerSectionProps> = ({
  selectedNode,
  baseBranch,
  compareBranch,
  isLoading,
  error,
  viewerType = "monaco",
}) => {
  const diffText = selectedNode?.source ?? "";
  const selectedPath = selectedNode?.path || selectedNode?.label || "";

  const diffFile = useMemo(() => {
    if (!diffText) return null;
    try {
      const files = parseDiff(diffText);
      return files[0] ?? null;
    } catch {
      return null;
    }
  }, [diffText]);

  return (
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
          <span className="text-xs text-muted-foreground">{selectedPath}</span>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Use the dropdowns above to choose the base and compare branches.
      </p>

      {isLoading && (
        <p className="mt-1 text-xs text-muted-foreground">Loading diff…</p>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {diffText ? (
        <div className="mt-4 flex-1 overflow-hidden">
          {viewerType === "monaco" ? (
            <MonacoDiffViewer
              diffContent={diffText}
              fileName={selectedPath || "diff.patch"}
              isLoading={isLoading}
            />
          ) : (
            <div className="h-full overflow-hidden rounded-md border bg-background text-xs">
              <div className="h-full overflow-auto">
                {diffFile ? (
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
                ) : (
                  <div className="flex items-center justify-center p-4">
                    <p className="text-xs text-muted-foreground">
                      Unable to parse diff
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
          Diff preview will appear here.
        </div>
      )}
    </div>
  );
};

export default DiffViewerSection;
