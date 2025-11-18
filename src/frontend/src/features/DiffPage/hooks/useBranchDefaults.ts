import { useState } from "react";
import type { Branches } from "../../../type";

interface UseBranchDefaultsReturn {
  baseBranch: string;
  compareBranch: string;
  setBaseBranch: (value: string) => void;
  setCompareBranch: (value: string) => void;
}

export const useBranchDefaults = (
  branches: Branches[]
): UseBranchDefaultsReturn => {
  const currentBranch = branches.find((b) => b.is_default);

  const [baseBranch, setBaseBranch] = useState(
    currentBranch?.name ?? branches[0]?.name ?? ""
  );
  const [compareBranch, setCompareBranch] = useState(
    branches.find((b) => b.is_current || !b.is_default)?.name ??
      branches[0]?.name ??
      ""
  );

  return {
    baseBranch,
    compareBranch,
    setBaseBranch,
    setCompareBranch,
  };
};

