import difflib
from collections import defaultdict
from typing import List

import git

from .diff_models import CodePosition, ProjectTreeNode, make_code_position
from .diff_parser import parse_code_structure
from .language_config import LANGUAGE_CONFIG


# Build a lookup from file-extension -> language key (e.g. ".py" -> "python").
EXTENSION_TO_LANGUAGE: dict[str, str] = {}
for _lang, _cfg in LANGUAGE_CONFIG.items():
    for _ext in _cfg["extensions"]:
        EXTENSION_TO_LANGUAGE[_ext] = _lang


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


def get_blob_content(repo: git.Repo, commit: git.Commit, path: str) -> str:
    """Safely get the content of a file from a specific commit."""
    try:
        return commit.tree[path].data_stream.read().decode("utf-8")
    except (KeyError, AttributeError):
        return ""


def analyze_semantic_conflicts(
    repo: git.Repo,
    path: str,
    base_commit: git.Commit,
    target_commit: git.Commit,
    source_commit: git.Commit,
    language: str,
) -> dict[str, str]:
    """
    Analyzes a file for semantic conflicts at the function/class level.

    Returns a dictionary mapping definition names to their status, e.g.,
    {'my_func': 'conflict', 'other_func': 'modified_on_source'}.
    """
    content_base = get_blob_content(repo, base_commit, path)
    content_target = get_blob_content(repo, target_commit, path)
    content_source = get_blob_content(repo, source_commit, path)

    # If the file hasn't changed on the target branch, there can be no
    # conflict. All changes are from the source branch.
    if content_base == content_target:
        return defaultdict(lambda: "modified_on_source")

    struct_base = parse_code_structure(content_base, language)
    struct_target = parse_code_structure(content_target, language)
    struct_source = parse_code_structure(content_source, language)

    all_keys = (
        set(struct_base.keys())
        | set(struct_target.keys())
        | set(struct_source.keys())
    )
    conflict_map = {}

    for name in all_keys:
        src_base = struct_base.get(name, {}).get("source")
        src_target = struct_target.get(name, {}).get("source")
        src_source = struct_source.get(name, {}).get("source")

        changed_on_target = src_base != src_target
        changed_on_source = src_base != src_source

        if changed_on_target and changed_on_source:
            # The definition was changed on BOTH branches.
            # If the final source is different, it's a conflict.
            if src_target != src_source:
                conflict_map[name] = "conflict"
            else:
                # Convergent change: both branches made the same change.
                conflict_map[name] = "modified_on_both"
        elif changed_on_target:
            conflict_map[name] = "modified_on_target"
        elif changed_on_source:
            conflict_map[name] = "modified_on_source"

    return conflict_map


def build_project_tree_from_branch_diff(
    repo: git.Repo, base_branch: str, compare_branch: str, tree_mode: str
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

    # Get commits for semantic conflict analysis
    target_commit = repo.commit(base_branch)
    source_commit = repo.commit(compare_branch)

    # First collect a flat list of file‑level nodes; we'll wrap these in a
    # folder hierarchy once we've processed the whole diff.
    file_nodes: List[ProjectTreeNode] = []

    for diff_item in diff_index:
        # resolve the path (handles renames)
        path = diff_item.b_path or diff_item.a_path

        if not path:
            continue

        # Detect language by matching the file extension against
        # LANGUAGE_CONFIG.
        language = None
        for ext, lang in EXTENSION_TO_LANGUAGE.items():
            if path.endswith(ext):
                language = lang
                break

        # Skip files whose extension we don't know about
        if language is None:
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

        # Analyze semantic conflicts at the definition level for this file
        def_conflict_map = analyze_semantic_conflicts(
            repo, path, base_for_diff, target_commit, source_commit, language
        )

        struct_base = parse_code_structure(content_base, language)
        struct_compare = parse_code_structure(content_compare, language)

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
            # Files don't have conflicts; only definitions do
            has_conflict=False,
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
            # Check if this definition has a conflict
            conflict_status = def_conflict_map.get(name)
            has_def_conflict = conflict_status == "conflict"

            def_nodes[name] = ProjectTreeNode(
                id=f"{path}:{name}",
                label=name.split(".")[-1],
                kind=def_type,
                status="added",
                has_conflict=has_def_conflict,
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
            # Check if this definition has a conflict
            conflict_status = def_conflict_map.get(name)
            has_def_conflict = conflict_status == "conflict"

            def_nodes[name] = ProjectTreeNode(
                id=f"{path}:{name}",
                label=name.split(".")[-1],
                kind=def_type,
                status="removed",
                code_position=make_code_position(info),
                has_conflict=has_def_conflict,
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

            # Check if this definition has a conflict
            conflict_status = def_conflict_map.get(name)
            has_def_conflict = conflict_status == "conflict"

            def_nodes[name] = ProjectTreeNode(
                id=f"{path}:{name}",
                label=name.split(".")[-1],
                kind=def_type,
                status="modified",
                code_position=make_code_position(position_source),
                path=path,
                source=diff_source,
                has_conflict=has_def_conflict,
            )

        # Attach nodes to the correct parents based on qualified name.
        children: List[ProjectTreeNode] = []
        for qualname, node in def_nodes.items():
            parent_qual, sep, _ = qualname.rpartition(".")
            if parent_qual and parent_qual in def_nodes:
                def_nodes[parent_qual].children.append(node)
            else:
                children.append(node)

        # Propagate conflicts from children to parents:
        # If any child has a conflict, mark the parent as conflicted too.
        def propagate_conflicts(nodes: List[ProjectTreeNode]) -> None:
            """Propagate conflict status from children to parents."""
            for node in nodes:
                if node.children:
                    propagate_conflicts(node.children)
                    # If any child has a conflict, mark parent as conflicted
                    if any(
                        child.has_conflict for child in node.children
                    ):
                        node.has_conflict = True

        propagate_conflicts(children)

        file_node.children = children
        # File also inherits conflicts from its definitions
        if any(child.has_conflict for child in children):
            file_node.has_conflict = True

        file_nodes.append(file_node)

    if tree_mode == "flat":
        return file_nodes

    # Build a folder hierarchy from the flat list of file nodes.
    # For a path like "src/backend/core/diff_utils.py" we create folder
    # nodes "src", "src/backend", "src/backend/core" and attach the file
    # node as a child of the deepest folder.
    root_nodes: List[ProjectTreeNode] = []
    dir_nodes: dict[str, ProjectTreeNode] = {}

    for file_node in file_nodes:
        parts = file_node.path.split("/")

        # Files at the repository root go directly under root_nodes.
        parent_children: List[ProjectTreeNode] = root_nodes
        parent_path = ""

        # Create/lookup folder nodes for all but the last path part
        # (which is the filename).
        for part in parts[:-1]:
            dir_path = part if not parent_path else f"{parent_path}/{part}"
            folder_node = dir_nodes.get(dir_path)
            if folder_node is None:
                folder_node = ProjectTreeNode(
                    id=dir_path,
                    label=part,
                    kind="folder",
                    # Any folder that appears in the diff contains changes.
                    status="modified",
                    code_position=CodePosition(
                        start_line=0,
                        end_line=0,
                        start_column=0,
                        end_column=0,
                    ),
                    path=dir_path,
                    source="",
                )
                dir_nodes[dir_path] = folder_node
                parent_children.append(folder_node)

            parent_children = folder_node.children
            parent_path = dir_path

        # Attach the file node to the deepest folder (or root).
        parent_children.append(file_node)

    # Sort folders/files alphabetically, with folders first at each level.
    def _sort_children(nodes: List[ProjectTreeNode]) -> None:
        nodes.sort(key=lambda n: (n.kind != "folder", n.label.lower()))
        for node in nodes:
            if node.children:
                _sort_children(node.children)

    _sort_children(root_nodes)

    return root_nodes
