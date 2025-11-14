from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.branchs import Branches, get_branches


class BranchRequest(BaseModel):
    repo_path: str


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
