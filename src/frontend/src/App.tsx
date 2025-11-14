import { useState } from "react";
import InitialPage from "./features/InitalPage";
import DiffPage from "./features/DiffPage";
import type { Branches } from "./type";
import { fetchBranches } from "./services/branch";

type Page = "initial" | "diff";

function App() {
  const [repoPath, setRepoPath] = useState<string>("");
  const [page, setPage] = useState<Page>("initial");
  const [branches, setBranches] = useState<Branches[]>([]);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [isCheckingRepo, setIsCheckingRepo] = useState(false);

  const handleOpenDiff = async () => {
    if (!repoPath.trim()) return;
    setIsCheckingRepo(true);
    setInitialError(null);

    try {
      const data = await fetchBranches(repoPath);
      setBranches(data);

      if (!data || data.length === 0) {
        setInitialError(
          "No branches found for this repository. Make sure it is a valid git repo."
        );
        return;
      }

      if (data.length === 1) {
        setInitialError(
          "This repository has only one branch. You need at least two branches to compare."
        );
        return;
      }

      setPage("diff");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load branches.";
      setInitialError(message);
    } finally {
      setIsCheckingRepo(false);
    }
  };

  const handleBackToInitial = () => {
    setPage("initial");
  };

  if (page === "initial") {
    return (
      <InitialPage
        repoPath={repoPath}
        onChangeRepoPath={setRepoPath}
        onOpenDiff={handleOpenDiff}
        error={initialError}
        isCheckingRepo={isCheckingRepo}
      />
    );
  }

  return (
    <DiffPage
      repoPath={repoPath}
      onBack={handleBackToInitial}
      branches={branches}
    />
  );
}

export default App;
