import git

from .diff_models import ProjectTreeNode
from .diff_utils import build_project_tree_from_branch_diff


def diff_to_tree(
    repo_path: str, base_branch: str, compare_branch: str, tree_mode: str
) -> list[ProjectTreeNode]:
    """Return a diff tree for the given repository path.

    Raises
    ------
    ValueError
        If the path does not exist or is not a valid git repository.
    """
    try:
        repo = git.Repo(repo_path)
        return build_project_tree_from_branch_diff(
            repo,
            base_branch,
            compare_branch,
            tree_mode
        )
    except (git.exc.InvalidGitRepositoryError, git.exc.NoSuchPathError) as exc:
        message = f"{repo_path!r} is not a valid git repository"
        raise ValueError(message) from exc
