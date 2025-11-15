import difflib
from typing import List

import git

from .diff_models import CodePosition, ProjectTreeNode, make_code_position
from .diff_parser import parse_code_structure


def build_def_diff_source(
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


def build_file_diff_source(
    file_path: str,
    old_source: str,
    new_source: str,
) -> str:
    """Build a unified diff string (git-style) for a whole file."""
    old_lines = (old_source or "").splitlines()
    new_lines = (new_source or "").splitlines()

    diff_lines = list(
        difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
            lineterm="",
        )
    )
    return "\n".join(diff_lines)


def build_project_tree_from_branch_diff(
    repo: git.Repo, base_branch: str, compare_branch: str
) -> list[ProjectTreeNode]:
    """
    Build a tree of changed files/definitions between two branches.

    We only want to register the *changes made on the compare branch*,
    not changes that might have happened on the base branch after the
    branches diverged. To achieve this we diff from the merge base
    (common ancestor) to the compare branch – equivalent to
    ``git diff base...compare`` – instead of a direct
    ``git diff base compare``.
    """
    try:
        base_commit = repo.commit(base_branch)
        compare_commit = repo.commit(compare_branch)
    except git.exc.BadName as e:
        raise ValueError(f"Could not find a branch or commit: {e}") from e

    # Find the common ancestor so that we only capture changes that
    # happened on the compare branch since it diverged from the base
    # branch. This mirrors `git diff base...compare`.
    merge_bases = repo.merge_base(base_commit, compare_commit)
    base_for_diff = merge_bases[0] if merge_bases else base_commit

    # create_patch=True is required so that diff_item.diff contains a
    # unified diff patch we can hand to the UI.
    diff_index = base_for_diff.diff(compare_commit, create_patch=True)
    if not diff_index:
        return []

    file_nodes: List[ProjectTreeNode] = []

    for diff_item in diff_index:
        # resolve the path (handles renames)
        path = diff_item.b_path or diff_item.a_path

        if not path or not path.endswith(".py"):
            continue

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

        # Build a clean, parseable unified diff for the whole file.
        file_diff_source = build_file_diff_source(
            path,
            content_base,
            content_compare,
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
            diff_source = build_def_diff_source(
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
                code_position=make_code_position(info),
                path=path,
                source=diff_source,
            )

        # Removed definitions
        for name in sorted(removed):
            info = struct_base.get(name, {})
            def_type = info.get("type", "definition")
            diff_source = build_def_diff_source(
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
                code_position=make_code_position(info),
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
            diff_source = build_def_diff_source(
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
                code_position=make_code_position(position_source),
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
