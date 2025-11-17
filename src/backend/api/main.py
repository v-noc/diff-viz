from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.branchs import Branches, get_branches
from core.diff_to_tree import ProjectTreeNode, diff_to_tree


class BranchRequest(BaseModel):
    repo_path: str


class DiffTreeRequest(BaseModel):
    repo_path: str
    base_branch: str
    compare_branch: str
    tree_mode: str = Field(default="flat")


app = FastAPI(title="Backend API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/branch", response_model=list[Branches])
async def branch_from_body(payload: BranchRequest) -> list[Branches]:
    """Return branches for the repository defined in the request body."""
    try:
        branches = get_branches(payload.repo_path)
    except ValueError as exc:
        # Surface a clear 400 error when the path is not a valid git repository
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return branches


@app.post("/diff-tree")
async def diff_tree(payload: DiffTreeRequest) -> list[ProjectTreeNode]:
    """Return the diff tree for the given repository path."""

    try:
        tree = diff_to_tree(
            payload.repo_path, payload.base_branch, payload.compare_branch, payload.tree_mode
        )
    except ValueError as exc:
        # Surface a clear 400 error when the path is not a valid git repository
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return tree
