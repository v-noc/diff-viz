from pydantic import BaseModel
import git


class Branches(BaseModel):
    name: str
    is_current: bool


def get_branchs(repo_path: str) -> list[Branches]:
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

    branches: list[Branches] = []
    for branch in repo.branches:
        branches.append(
            Branches(
                name=branch.name,
                is_current=branch.name == repo.active_branch.name
            )
        )

    return branches
