export type ChangeStatus = "added" | "removed" | "modified" | "unchanged";

export type NodeKind =
    | "file"
    | "folder"
    | "symbol"
    | "class"
    | "function"
    | "definition";

export interface CodePosition {
    start_line: number;
    end_line: number;
    start_column: number;
    end_column: number;
}

export interface ProjectTreeNode {
    id: string;
    label: string;
    kind: NodeKind;
    status?: ChangeStatus;
    /**
     * Repository-relative file path for this node.
     */
    path?: string;
    /**
     * Optional children (e.g. methods inside a class).
     */
    children?: ProjectTreeNode[];
    /**
     * Unified diff text (git-style) for this node or file.
     */
    source?: string;
    /**
     * Location of the node in the (new) source file.
     */
    code_position?: CodePosition;
    /**
     * Whether this node has a conflict.
     */
    has_conflict?: boolean;
}
