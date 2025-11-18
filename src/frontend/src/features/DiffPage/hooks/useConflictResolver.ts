import { useEffect, useState } from "react";
import { fetchConflictCode } from "../../../services/diifs";

interface UseConflictResolverOptions {
  repoPath: string;
  id: string;
  baseBranch: string;
  compareBranch: string;
  enabled?: boolean;
}

interface ConflictCode {
  destCode: string;
  sourceCode: string;
}

interface UseConflictResolverReturn {
  conflictCode: ConflictCode | null;
  isLoading: boolean;
  error: string | null;
}

export const useConflictResolver = ({
  repoPath,
  id,
  baseBranch,
  compareBranch,
  enabled = true,
}: UseConflictResolverOptions): UseConflictResolverReturn => {
  const [conflictCode, setConflictCode] = useState<ConflictCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !repoPath || !id || !baseBranch || !compareBranch) {
      setConflictCode(null);
      return;
    }

    let isCancelled = false;

    Promise.resolve()
      .then(() => {
        if (isCancelled) return;
        setIsLoading(true);
        setError(null);
        return fetchConflictCode(
          repoPath,
          id,
          baseBranch,
          compareBranch
        );
      })
      .then((data) => {
        if (isCancelled) return;
        setConflictCode(
          data
            ? { destCode: data.dest_code, sourceCode: data.source_code }
            : null
        );
      })
      .catch((err) => {
        if (isCancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load conflict code.";
        setError(message);
        setConflictCode(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [repoPath, id, baseBranch, compareBranch, enabled]);

  return { conflictCode, isLoading, error };
};

