from pydantic import BaseModel
import git


class ProjectTreeNode(BaseModel):
    id: str
    label: str
    kind: str
    status: str
    path: str
    children: list["ProjectTreeNode"]


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
