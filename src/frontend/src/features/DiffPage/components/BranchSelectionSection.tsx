import type { FC } from "react";
import type { Branches } from "../../../type";
import BranchSelect from "./BranchSelect";
import RepoPathInfo from "./RepoPathInfo";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface BranchSelectionSectionProps {
  branches: Branches[];
  baseBranch: string;
  compareBranch: string;
  onBaseBranchChange: (value: string) => void;
  onCompareBranchChange: (value: string) => void;
  onSwapBranches?: () => void;
  repoPath: string;
}

const BranchSelectionSection: FC<BranchSelectionSectionProps> = ({
  branches,
  baseBranch,
  compareBranch,
  onBaseBranchChange,
  onCompareBranchChange,
  onSwapBranches,
  repoPath,
}) => {
  return (
    <div className="flex flex-col ">
      <div className="flex flex-wrap items-start justify-between">
        <BranchSelect
          label="Base branch"
          branches={branches}
          value={baseBranch || undefined}
          onChange={onBaseBranchChange}
        />

        {onSwapBranches && (
          <Button
            variant="outline"
            size="icon"
            className="mt-6"
            onClick={onSwapBranches}
            aria-label="Swap base and compare branches"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        )}
        <BranchSelect
          label="Compare branch"
          branches={branches}
          value={compareBranch || undefined}
          onChange={onCompareBranchChange}
        />
      </div>
      <RepoPathInfo repoPath={repoPath} />
    </div>
  );
};

export default BranchSelectionSection;
