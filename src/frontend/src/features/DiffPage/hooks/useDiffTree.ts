import { useEffect, useState } from "react";
import type { ProjectTreeNode } from "../ProjectTree/types";
import { fetchDiffTree } from "../../../services/diifs";

interface UseDiffTreeOptions {
  repoPath: string;
  baseBranch: string;
  compareBranch: string;
}

interface UseDiffTreeReturn {
  treeNodes: ProjectTreeNode[];
  isLoading: boolean;
  error: string | null;
}

export const useDiffTree = ({
  repoPath,
  baseBranch,
  compareBranch,
}: UseDiffTreeOptions): UseDiffTreeReturn => {
  const [treeNodes, setTreeNodes] = useState<ProjectTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoPath || !baseBranch || !compareBranch) return;

    let isCancelled = false;

    Promise.resolve()
      .then(() => {
        if (isCancelled) return;
        setIsLoading(true);
        setError(null);
        return fetchDiffTree(repoPath, baseBranch, compareBranch);
      })
      .then((data) => {
        if (isCancelled) return;
        setTreeNodes(data ?? []);
      })
      .catch((err) => {
        if (isCancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load diff tree.";
        setError(message);
        setTreeNodes([]);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [repoPath, baseBranch, compareBranch]);

  return { treeNodes, isLoading, error };
};

