import type { FC } from "react";

interface RepoPathInfoProps {
  repoPath: string;
}

const RepoPathInfo: FC<RepoPathInfoProps> = ({ repoPath }) => {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Repo path:</span>{" "}
      <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
        {repoPath || "No path provided"}
      </code>
    </p>
  );
};

export default RepoPathInfo;
