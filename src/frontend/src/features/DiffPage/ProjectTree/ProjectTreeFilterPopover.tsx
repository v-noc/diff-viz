import type { FC } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Filter, FileCode2, Plus, Minus, CircleDashed } from "lucide-react";

const ProjectTreeFilterPopover: FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open filters"
          className="shrink-0"
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground">Filters</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
          >
            Reset
          </Button>
        </div>

        <Separator className="my-2" />

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              File type
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Toggle size="sm" variant="outline">
                All
              </Toggle>
              <Toggle size="sm" variant="outline">
                <FileCode2 className="h-3 w-3" />
                .ts
              </Toggle>
              <Toggle size="sm" variant="outline">
                <FileCode2 className="h-3 w-3" />
                .tsx
              </Toggle>
              <Toggle size="sm" variant="outline">
                <FileCode2 className="h-3 w-3" />
                .py
              </Toggle>
              <Toggle size="sm" variant="outline">
                Other
              </Toggle>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              Modification type
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Toggle size="sm" variant="outline">
                <Plus className="h-3 w-3" />
                Added
              </Toggle>
              <Toggle size="sm" variant="outline">
                <Minus className="h-3 w-3" />
                Removed
              </Toggle>
              <Toggle size="sm" variant="outline">
                <CircleDashed className="h-3 w-3" />
                Modified
              </Toggle>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectTreeFilterPopover;


