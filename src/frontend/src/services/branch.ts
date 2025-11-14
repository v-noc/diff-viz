import { api } from "../lib/api";
import type { Branches } from "../type";

async function fetchBranches(repoPath: string): Promise<Branches[]> {
    return api<Branches[]>("/branch", {
        body: { repo_path: repoPath },
    });
}

export { fetchBranches };

