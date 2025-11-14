export type ChangeStatus = "added" | "removed" | "modified" | "unchanged";

export type NodeKind = "file" | "folder" | "symbol";

export interface ProjectTreeNode {
    id: string;
    label: string;
    kind: NodeKind;
    status?: ChangeStatus;
    /**
     * Optional path for files so real data can map to a diff.
     */
    path?: string;
    children?: ProjectTreeNode[];
}


