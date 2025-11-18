import git
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.branchs import Branches, get_branches
from core.diff_to_tree import ProjectTreeNode, diff_to_tree
from core.diff_utils import get_blob_content
from core.language_config import LANGUAGE_CONFIG
from core.diff_parser import parse_code_structure


class BranchRequest(BaseModel):
    repo_path: str


class DiffTreeRequest(BaseModel):
    repo_path: str
    base_branch: str
    compare_branch: str
    tree_mode: str = Field(default="flat")


class ConflictResolverResponse(BaseModel):
    dest_code: str
    source_code: str


class ConflictResolverRequest(BaseModel):
    repo_path: str
    id: str
    base_branch: str
    compare_branch: str


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
            payload.repo_path,
            payload.base_branch,
            payload.compare_branch,
            payload.tree_mode,
        )
    except ValueError as exc:
        # Surface a clear 400 error when the path is not a valid git repository
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return tree


def get_language_for_path(file_path: str) -> str:
    """Determine language from file extension."""
    for lang, cfg in LANGUAGE_CONFIG.items():
        for ext in cfg["extensions"]:
            if file_path.endswith(ext):
                return lang
    return ""


def extract_def_code(
    content: str, def_name: str, language: str
) -> str:
    """Extract source code for a specific definition."""
    if not content:
        return ""

    struct = parse_code_structure(content, language)
    def_info = struct.get(def_name, {})
    return def_info.get("source", "")


@app.post("/get-dest-compare-code")
async def get_dest_compare_code(
    payload: ConflictResolverRequest,
) -> ConflictResolverResponse:
    """
    Return source and destination code for conflict resolution.

    The id can be either:
    - A file path (e.g., "src/file.py")
    - A definition within a file (e.g., "src/file.py:my_function")
    """
    try:
        repo = git.Repo(payload.repo_path)

        # Parse the id to extract file path and optional definition name
        if ":" in payload.id:
            file_path, def_name = payload.id.rsplit(":", 1)
        else:
            file_path = payload.id
            def_name = None

        # Get commit objects
        target_commit = repo.commit(payload.base_branch)
        source_commit = repo.commit(payload.compare_branch)

        # Get file content from both branches
        dest_content = get_blob_content(repo, target_commit, file_path)
        source_content = get_blob_content(repo, source_commit, file_path)

        # Determine language
        language = get_language_for_path(file_path)
        if not language:
            raise ValueError(f"Unsupported file type: {file_path}")

        # If specific definition is requested, extract it
        if def_name:
            dest_code = extract_def_code(dest_content, def_name, language)
            source_code = extract_def_code(source_content, def_name, language)
        else:
            dest_code = dest_content
            source_code = source_content

        if not dest_code and not source_code:
            raise ValueError(
                f"Could not find code for {payload.id} "
                f"in branches {payload.base_branch} "
                f"or {payload.compare_branch}"
            )

        return ConflictResolverResponse(
            dest_code=dest_code, source_code=source_code
        )

    except git.exc.InvalidGitRepositoryError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"{payload.repo_path!r} is not a valid git repository",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Error retrieving code: {str(exc)}"
        ) from exc
