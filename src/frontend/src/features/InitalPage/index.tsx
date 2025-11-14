import type { FC, FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InitialPageProps {
  repoPath: string;
  onChangeRepoPath: (value: string) => void;
  onOpenDiff: () => void;
  error?: string | null;
  isCheckingRepo?: boolean;
}

const InitialPage: FC<InitialPageProps> = ({
  repoPath,
  onChangeRepoPath,
  onOpenDiff,
  error,
  isCheckingRepo,
}) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!repoPath.trim()) return;
    onOpenDiff();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-xl border bg-card shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add repository path
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the full path to a local Git repository on your machine to
            start inspecting its changes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Repository path
            <input
              type="text"
              value={repoPath}
              onChange={(e) => onChangeRepoPath(e.target.value)}
              placeholder="/Users/you/projects/my-repo"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertTitle>Unable to open diff</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!repoPath.trim() || isCheckingRepo}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isCheckingRepo ? "Checking repository…" : "Open diff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitialPage;
