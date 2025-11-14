import type { FC } from "react";

interface DiffPageHeaderProps {
  onBack: () => void;
  currentBranchName?: string;
}

const DiffPageHeader: FC<DiffPageHeaderProps> = ({
  onBack,
  currentBranchName,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span>Diff viewer</span>
          {currentBranchName && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {currentBranchName}
            </span>
          )}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Review changes for your repository and manage branches.
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent"
      >
        Change repo
      </button>
    </div>
  );
};

export default DiffPageHeader;
