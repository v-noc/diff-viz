import type { FC } from "react";
import type { Branches } from "../../type";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DiffPageProps {
  repoPath: string;
  onBack: () => void;
  branches: Branches[];
}

interface DiffPageHeaderProps {
  onBack: () => void;
}

const DiffPageHeader: FC<DiffPageHeaderProps> = ({ onBack }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Diff viewer</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review changes for your repository and manage branches.
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent transition"
      >
        Change repo
      </button>
    </div>
  );
};

interface RepoPathInfoProps {
  repoPath: string;
}

const RepoPathInfo: FC<RepoPathInfoProps> = ({ repoPath }) => {
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Selected repo path:</span>{" "}
      <code className="text-xs bg-background rounded px-1.5 py-0.5 border ml-1">
        {repoPath || "No path provided"}
      </code>
    </div>
  );
};

interface CurrentBranchCardProps {
  currentBranch?: Branches;
}

const CurrentBranchCard: FC<CurrentBranchCardProps> = ({ currentBranch }) => {
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">
        Current branch
      </p>
      <p className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {currentBranch?.name ?? "Unknown"}
      </p>
    </div>
  );
};

interface BranchesSummaryProps {
  branches: Branches[];
}

const BranchesSummary: FC<BranchesSummaryProps> = ({ branches }) => {
  return (
    <div className="rounded-lg border bg-background px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Branches</p>
        <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
          {branches.length} total
        </span>
      </div>
      <div className="rounded-md border bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
        Search branches (coming soon)
      </div>
    </div>
  );
};

interface BranchesListProps {
  branches: Branches[];
}

const BranchesList: FC<BranchesListProps> = ({ branches }) => {
  if (branches.length === 0) {
    return (
      <Alert variant="destructive" className="text-xs">
        <AlertTitle>No branches available</AlertTitle>
        <AlertDescription>
          No branches were provided for this repository.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ul className="mt-1 max-h-64 space-y-1 overflow-y-auto text-sm">
      {branches.map((branch) => (
        <li
          key={branch.name}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-default"
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span>{branch.name}</span>
          </div>
          {branch.is_current && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              current
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

const DiffPage: FC<DiffPageProps> = ({ repoPath, onBack, branches }) => {
  const currentBranch = branches.find((b) => b.is_current);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-4xl rounded-xl border bg-card shadow-sm p-8 space-y-6">
        <DiffPageHeader onBack={onBack} />

        <RepoPathInfo repoPath={repoPath} />

        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6 items-start">
          <div className="space-y-3">
            <CurrentBranchCard currentBranch={currentBranch} />
            <BranchesSummary branches={branches} />
          </div>

          <div className="rounded-lg border bg-background px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Select a branch</p>
            </div>

            <BranchesList branches={branches} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffPage;
