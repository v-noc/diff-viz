import difflib
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


def _make_code_position(def_info: dict) -> CodePosition:
    """Safely construct a CodePosition from parsed definition info."""
    return CodePosition(
        start_line=def_info.get("start_line", 0),
        end_line=def_info.get("end_line", 0),
        start_column=def_info.get("start_column", 0),
        end_column=def_info.get("end_column", 0),
    )


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
                    child,
                    (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef),
                ):
                    node_type = "class" if isinstance(
                        child, ast.ClassDef
                    ) else "function"
                    # Build a qualified name reflecting the nesting
                    # structure.
                    qualname_parts = parents + [child.name]
                    qualname = ".".join(qualname_parts)

                    # Extract the exact source for this definition and its
                    # positional information so we can build tree nodes
                    # that can be highlighted later.
                    structure[qualname] = {
                        "type": node_type,
                        "source": ast.get_source_segment(source_code, child),
                        "start_line": getattr(child, "lineno", 0),
                        "end_line": getattr(
                            child, "end_lineno", getattr(child, "lineno", 0)
                        ),
                        "start_column": getattr(child, "col_offset", 0),
                        "end_column": getattr(
                            child,
                            "end_col_offset",
                            getattr(child, "col_offset", 0),
                        ),
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
        build_project_tree_from_branch_diff(repo, base_branch, compare_branch)
    except (git.exc.InvalidGitRepositoryError, git.exc.NoSuchPathError) as exc:
        message = f"{repo_path!r} is not a valid git repository"
        raise ValueError(message) from exc


def _build_def_diff_source(
    file_path: str,
    def_name: str,
    old_source: str,
    new_source: str,
) -> str:
    """Build a unified diff string (git-style) for a single definition."""
    old_lines = (old_source or "").splitlines()
    new_lines = (new_source or "").splitlines()

    diff_lines = list(
        difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f"{file_path}:{def_name}:old",
            tofile=f"{file_path}:{def_name}:new",
            lineterm="",
        )
    )
    return "\n".join(diff_lines)


def build_project_tree_from_branch_diff(repo: git.Repo, base_branch: str, compare_branch: str) -> list[ProjectTreeNode]:
    """Build a tree of changed files/definitions between two branches."""
    try:
        base_commit = repo.commit(base_branch)
        compare_commit = repo.commit(compare_branch)
    except git.exc.BadName as e:
        raise ValueError(f"Could not find a branch or commit: {e}") from e

    # create_patch=True is required so that diff_item.diff contains a
    # unified diff patch we can hand to the UI.
    diff_index = base_commit.diff(compare_commit, create_patch=True)
    if not diff_index:
        return []

    file_nodes: List[ProjectTreeNode] = []

    for diff_item in diff_index:
        # resolve the path (handles renames)
        path = diff_item.b_path or diff_item.a_path

        if not path or not path.endswith(".py"):
            continue

        # Raw file-level unified diff (git style) – good input for parseDiff
        try:
            file_diff_source = diff_item.diff.decode("utf-8")

        except AttributeError:
            # Some diff items may not carry a direct diff (e.g. binary)
            file_diff_source = ""

        # Get the file content from before (a_blob) and after (b_blob)
        # the change
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

        added = compare_keys - base_keys
        removed = base_keys - compare_keys
        common = base_keys & compare_keys

        modified = [
            name
            for name in common
            if struct_base[name]["source"] != struct_compare[name]["source"]
        ]

        # Map git change types to a simple status for the file node.
        # On some GitPython versions, change_type may be None when
        # create_patch=True, so we derive it from blobs as a fallback.
        raw_change_type = getattr(diff_item, "change_type", None)
        if raw_change_type:
            change_type = raw_change_type
        else:
            if diff_item.a_blob is None and diff_item.b_blob is not None:
                change_type = "A"
            elif diff_item.a_blob is not None and diff_item.b_blob is None:
                change_type = "D"
            else:
                change_type = "M"

        # For modified files with no semantic changes, skip.
        # For added/deleted files, always keep them (even if empty).
        if change_type not in ("A", "D") and not any(
            [added, removed, modified]
        ):
            continue
        if change_type == "A":
            file_status = "added"
        elif change_type == "D":
            file_status = "removed"
        else:
            file_status = "modified"

        file_node = ProjectTreeNode(
            id=path,
            label=path,
            kind="file",
            status=file_status,
            code_position=CodePosition(
                start_line=0,
                end_line=0,
                start_column=0,
                end_column=0,
            ),
            path=path,
            source=file_diff_source,
        )

        # Build child nodes for each changed definition.
        # First create a flat map keyed by qualified name,
        # then assemble a hierarchy (e.g. "main.pop" under "main").
        def_nodes: dict[str, ProjectTreeNode] = {}

        # Added definitions
        for name in sorted(added):
            info = struct_compare.get(name, {})
            def_type = info.get("type", "definition")
            diff_source = _build_def_diff_source(
                path,
                name,
                "",
                info.get("source", ""),
            )
            def_nodes[name] = ProjectTreeNode(
                id=f"{path}:{name}",
                label=name.split(".")[-1],
                kind=def_type,
                status="added",
                code_position=_make_code_position(info),
                path=path,
                source=diff_source,
            )

        # Removed definitions
        for name in sorted(removed):
            info = struct_base.get(name, {})
            def_type = info.get("type", "definition")
            diff_source = _build_def_diff_source(
                path,
                name,
                info.get("source", ""),
                "",
            )
            def_nodes[name] = ProjectTreeNode(
                id=f"{path}:{name}",
                label=name.split(".")[-1],
                kind=def_type,
                status="removed",
                code_position=_make_code_position(info),
                path=path,
                source=diff_source,
            )

        # Modified definitions
        for name in sorted(modified):
            base_info = struct_base.get(name, {})
            compare_info = struct_compare.get(name, {})
            def_type = compare_info.get(
                "type", base_info.get("type", "definition")
            )
            diff_source = _build_def_diff_source(
                path,
                name,
                base_info.get("source", ""),
                compare_info.get("source", ""),
            )
            # Use the "new" position where possible
            position_source = compare_info or base_info
            def_nodes[name] = ProjectTreeNode(
                id=f"{path}:{name}",
                label=name.split(".")[-1],
                kind=def_type,
                status="modified",
                code_position=_make_code_position(position_source),
                path=path,
                source=diff_source,
            )

        # Attach nodes to the correct parents based on qualified name.
        children: List[ProjectTreeNode] = []
        for qualname, node in def_nodes.items():
            parent_qual, sep, _ = qualname.rpartition(".")
            if parent_qual and parent_qual in def_nodes:
                def_nodes[parent_qual].children.append(node)
            else:
                children.append(node)

        file_node.children = children
        file_nodes.append(file_node)

    return file_nodes
