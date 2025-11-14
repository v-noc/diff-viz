import type { FC } from "react";
import type { Branches } from "../../../type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BranchSelectProps {
  label: string;
  branches: Branches[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const BranchSelect: FC<BranchSelectProps> = ({
  label,
  branches,
  value,
  placeholder = "Select branch",
  onChange,
}) => {
  const hasBranches = branches.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange} disabled={!hasBranches}>
        <SelectTrigger size="sm" className="min-w-[160px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        {hasBranches && (
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.name} value={branch.name}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        )}
      </Select>
    </div>
  );
};

export default BranchSelect;
