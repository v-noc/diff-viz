import type { FC } from "react";
import type { Branches } from "../../../type";
import BranchesList from "./BranchesList";

interface BranchColumnProps {
  title: string;
  branches: Branches[];
}

const BranchColumn: FC<BranchColumnProps> = ({ title, branches }) => {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-background px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {branches.length} total
        </span>
      </div>
      <div className="mt-2 min-h-0 flex-1">
        <BranchesList branches={branches} />
      </div>
    </div>
  );
};

export default BranchColumn;
