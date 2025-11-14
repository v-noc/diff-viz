import type { FC } from "react";
import type { Branches } from "../../../type";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    <ul className="max-h-64 space-y-1 overflow-y-auto text-xs md:text-sm">
      {branches.map((branch) => (
        <li
          key={branch.name}
          className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60"
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

export default BranchesList;
