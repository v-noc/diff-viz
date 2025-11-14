from typing import List
from pydantic import BaseModel
import git
import ast


class CodePosition(BaseModel):
    start_line: int
    end_line: int
    start_column: int
    end_column: int


class ProjectTreeNode(BaseModel):
    id: str
    label: str
    kind: str
    status: str
    code_position: CodePosition
    path: str
    status: str = "unchanged"  # Default status during initial parsing
    code_position: CodePosition
    path: str
    children: List["ProjectTreeNode"] = []
    # Temporarily store source to compare nodes for modifications
    source: str = ""


def parse_code_structure(source_code):
    """
    Parse Python source code into an AST and extract the source text of
    all functions and classes (including nested ones), along with
    their types.

    Each definition is keyed by a *qualified name* that encodes its
    nesting, e.g.:

    - ``foo``                  – top‑level function
    - ``Foo``                  – top‑level class
    - ``Foo.bar``             – method ``bar`` inside class ``Foo``
    - ``main.pop``            – nested function ``pop`` inside ``main``

    Args:
        source_code (str): The Python code to parse.

    Returns:
        dict[str, dict]: A mapping like::

            {
                "qualified.name": {
                    "type": "function" | "class",
                    "source": source_text,
                },
                ...
            }
    """
    structure: dict[str, dict] = {}
    if not source_code:
        return structure

    try:
        tree = ast.parse(source_code)

        def visit(node: ast.AST, parents: list[str]) -> None:
            for child in ast.iter_child_nodes(node):
                if isinstance(
                    child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
                ):
                    node_type = "class" if isinstance(
                        child, ast.ClassDef
                    ) else "function"
                    # Build a qualified name reflecting the nesting structure.
                    qualname_parts = parents + [child.name]
                    qualname = ".".join(qualname_parts)

                    structure[qualname] = {
                        "type": node_type,
                        "position": CodePosition(
                            start_line=child.lineno,
                            end_line=child.end_lineno,
                            start_column=child.col_offset,
                            end_column=child.end_col_offset,
                        ),
                        "source": ast.get_source_segment(source_code, child),
                    }

                    # Recurse into the body to pick up further nested defs.
                    visit(child, qualname_parts)
                else:
                    # Keep walking the tree so we can find nested defs
                    # under other node types (if/for/with/etc.).
                    visit(child, parents)

        visit(tree, [])

    except (SyntaxError, TypeError):
        # Gracefully handle files that are not valid Python
        pass

    return structure


def diff_to_tree(repo_path: str, base_branch: str, compare_branch: str) -> list[ProjectTreeNode]:
    """Return branches for the given repository path.

    Raises
    ------
    ValueError
        If the path does not exist or is not a valid git repository.
    """
    try:
        repo = git.Repo(repo_path)
    except (git.exc.InvalidGitRepositoryError, git.exc.NoSuchPathError) as exc:
        message = f"{repo_path!r} is not a valid git repository"
        raise ValueError(message) from exc


def analyze_branch_diff(repo, base_branch, compare_branch):
    """
    Compares two branches in a local repository and prints the semantic
    (AST-level) differences for each changed Python file.

    Args:
        repo (git.Repo): An initialized GitPython Repo object.
        base_branch (str): The name of the base branch (e.g., 'main').
        compare_branch (str): The name of the branch to compare against the base.
    """

    print(
        "[*] Comparing "
        f"`{base_branch}` (base) -> `{compare_branch}` (compare)"
    )
    try:
        # Get the commit objects for each branch name
        base_commit = repo.commit(base_branch)
        compare_commit = repo.commit(compare_branch)
    except git.exc.BadName as e:
        print(f"[!] Error: Could not find a branch or commit. {e}")
        raise ValueError(f"Could not find a branch or commit. {e}") from e

    # Get a list of differences between the two commits
    diff_index = base_commit.diff(compare_commit)

    if not diff_index:
        print("\n[*] No differences found between the two branches.")
        return

    # Track files that have semantic (top-level definition) changes
    changed_files = []

    for diff_item in diff_index:
        print(f"Diff item: {diff_item}")
        # Get the file path, handling renames
        path = diff_item.b_path or diff_item.a_path
        if not path.endswith('.py'):
            continue

        print("\n" + "="*80)
        print(f"File: {path} (Change type: {diff_item.change_type})")
        print("="*80)

        # Get the file content from before (a_blob) and after (b_blob) the change
        # If a file was added, a_blob is None. If deleted, b_blob is None.
        content_base = (
            diff_item.a_blob.data_stream.read().decode("utf-8")
            if diff_item.a_blob
            else ""
        )
        content_compare = (
            diff_item.b_blob.data_stream.read().decode("utf-8")
            if diff_item.b_blob
            else ""
        )

        struct_base = parse_code_structure(content_base)
        struct_compare = parse_code_structure(content_compare)

        base_keys = set(struct_base.keys())
        compare_keys = set(struct_compare.keys())

        # Use set logic to find changes
        added = compare_keys - base_keys
        removed = base_keys - compare_keys
        common = base_keys & compare_keys
