import type { FC } from "react";
import { useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Filter, FileCode2, Plus, Minus, CircleDashed } from "lucide-react";
import type { ChangeStatus } from "./types";

interface FilterState {
  fileTypes: Set<string>;
  modificationTypes: Set<string>;
}

interface ProjectTreeFilterPopoverProps {
  fileExtensions: Map<string, number>;
  modificationTypes: Map<string, number>;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const getFileTypeIcon = (ext: string) => {
  if (ext === "no-ext") return null;
  return <FileCode2 className="h-3 w-3" />;
};

const getModificationTypeIcon = (type: ChangeStatus) => {
  switch (type) {
    case "added":
      return <Plus className="h-3 w-3" />;
    case "removed":
      return <Minus className="h-3 w-3" />;
    case "modified":
      return <CircleDashed className="h-3 w-3" />;
    case "unchanged":
      return null;
  }
};

const getModificationTypeLabel = (type: ChangeStatus) => {
  switch (type) {
    case "added":
      return "Added";
    case "removed":
      return "Removed";
    case "modified":
      return "Modified";
    case "unchanged":
      return "Unchanged";
  }
};

const ProjectTreeFilterPopover: FC<ProjectTreeFilterPopoverProps> = ({
  fileExtensions,
  modificationTypes,
  filters,
  onFiltersChange,
}) => {
  // Sort file extensions by count (descending)
  const sortedExtensions = useMemo(() => {
    return Array.from(fileExtensions.entries()).sort((a, b) => b[1] - a[1]);
  }, [fileExtensions]);

  // Sort modification types in a logical order
  const sortedModificationTypes = useMemo(() => {
    const order: Record<ChangeStatus, number> = {
      added: 0,
      removed: 1,
      modified: 2,
      unchanged: 3,
    };
    return Array.from(modificationTypes.entries()).sort(
      (a, b) => order[a[0] as ChangeStatus] - order[b[0] as ChangeStatus]
    );
  }, [modificationTypes]);

  const handleToggleFileType = (ext: string) => {
    const newFileTypes = new Set(filters.fileTypes);
    if (newFileTypes.has(ext)) {
      newFileTypes.delete(ext);
    } else {
      newFileTypes.add(ext);
    }
    onFiltersChange({
      ...filters,
      fileTypes: newFileTypes,
    });
  };

  const handleToggleModificationType = (type: string) => {
    const newModTypes = new Set(filters.modificationTypes);
    if (newModTypes.has(type)) {
      newModTypes.delete(type);
    } else {
      newModTypes.add(type);
    }
    onFiltersChange({
      ...filters,
      modificationTypes: newModTypes,
    });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      fileTypes: new Set(),
      modificationTypes: new Set(),
    });
  };

  const handleSelectAllFileTypes = () => {
    if (filters.fileTypes.size === fileExtensions.size) {
      onFiltersChange({
        ...filters,
        fileTypes: new Set(),
      });
    } else {
      const allExtensions = new Set(fileExtensions.keys());
      onFiltersChange({
        ...filters,
        fileTypes: allExtensions,
      });
    }
  };

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
      <PopoverContent align="end" className="w-72 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground">Filters</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={handleResetFilters}
          >
            Reset
          </Button>
        </div>

        <Separator className="my-2" />

        <div className="space-y-4">
          {/* File Type Section */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              File type ({fileExtensions.size})
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Toggle
                size="sm"
                variant="outline"
                pressed={
                  filters.fileTypes.size === fileExtensions.size &&
                  fileExtensions.size > 0
                }
                onPressedChange={handleSelectAllFileTypes}
              >
                All
              </Toggle>
              {sortedExtensions.map(([ext, count]) => (
                <Toggle
                  key={ext}
                  size="sm"
                  variant="outline"
                  pressed={filters.fileTypes.has(ext)}
                  onPressedChange={() => handleToggleFileType(ext)}
                  title={`${count} file(s)`}
                >
                  {getFileTypeIcon(ext)}
                  <span className="text-[10px]">{ext}</span>
                  <span className="text-[9px] text-muted-foreground ml-1">
                    ({count})
                  </span>
                </Toggle>
              ))}
            </div>
          </div>

          {/* Modification Type Section */}
          <div>
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              Modification type ({modificationTypes.size})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sortedModificationTypes.map(([type, count]) => (
                <Toggle
                  key={type}
                  size="sm"
                  variant="outline"
                  pressed={filters.modificationTypes.has(type)}
                  onPressedChange={() => handleToggleModificationType(type)}
                  title={`${count} item(s)`}
                >
                  {getModificationTypeIcon(type as ChangeStatus)}
                  <span className="text-[10px]">
                    {getModificationTypeLabel(type as ChangeStatus)}
                  </span>
                  <span className="text-[9px] text-muted-foreground ml-1">
                    ({count})
                  </span>
                </Toggle>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectTreeFilterPopover;
