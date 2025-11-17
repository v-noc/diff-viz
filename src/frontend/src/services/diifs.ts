import { api } from "../lib/api";
import type { ProjectTreeNode } from "../features/DiffPage/ProjectTree/types";

interface DiffTreeRequestBody {
    repo_path: string;
    base_branch: string;
    compare_branch: string;
    tree_mode: "flat" | "tree";
}

async function fetchDiffTree(
    repoPath: string,
    baseBranch: string,
    compareBranch: string,
    treeMode?: "flat" | "tree"
): Promise<ProjectTreeNode[]> {
    const body: DiffTreeRequestBody = {
        repo_path: repoPath,
        base_branch: baseBranch,
        compare_branch: compareBranch,
        tree_mode: treeMode ?? "flat",
    };

    return api<ProjectTreeNode[]>("/diff-tree", {
        body,
    });
}

export { fetchDiffTree };


