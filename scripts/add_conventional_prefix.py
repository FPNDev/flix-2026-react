"""Make the commit message start with the current branch name."""

import argparse
import re
import subprocess
import sys
from typing import List, Optional

ALLOWED_BRANCH_PREFIXES = [
    "init",
    "feat",
    "fix",
    "refactor",
    "test",
    "docs"
]


def branch_name_is_valid(branch_name: str) -> bool:
    """Check if branch name is valid.

    Parameters
    ----------
    branch_name : str
        The name of the branch.

    Returns
    -------
    bool
        True if the branch name is valid, False otherwise.
    """
    # Removed extra '/' since ALLOWED_BRANCH_PREFIXES already ends with '/'
    prefix_regex = "|".join(ALLOWED_BRANCH_PREFIXES)
    pattern = rf"^({prefix_regex})/[A-Za-z\d-]+"

    return bool(re.match(pattern, branch_name))


def get_branch_type(branch_name: str) -> str:
    """Get the type of the branch.

    Parameters
    ----------
    branch_name : str
        The name of the branch.

    Returns
    -------
    str
        The type of the branch.
    """
    return branch_name.split("/")[0]


def branch_is_main(branch_name: str) -> bool:
    """Check if the branch is the main branch.

    Parameters
    ----------
    branch_name : str
        The name of the branch.

    Returns
    -------
    bool
        True if the branch is the main branch, False otherwise.
    """
    return branch_name.lower() in ["main", "master"]


def main(argv: Optional[List[str]] = None) -> None:
    """Add the current branch name to the commit message.

    The commit message will be prefixed with a conventional commit message friendly version
    of the current branch name.

    Parameters
    ----------
    argv : Optional[List[str]]
        The command line arguments, by default None.
    """
    parser = argparse.ArgumentParser(
        description="Append branch type to commit message and validate branch name",
    )
    # Positional argument for file path passed by pre-commit / Git
    parser.add_argument(
        "input",
        type=str,
        help="Commit file path",
    )
    # Fixed boolean flag action
    parser.add_argument(
        "--allow-main",
        action="store_true",
        help="Allow main branch to be used for commits",
        default=False,
    )
    args = parser.parse_args(argv)

    commit_msg_filepath: str = args.input
    allow_main: bool = args.allow_main

    try:
        branch_name = subprocess.check_output(
            ["git", "symbolic-ref", "--short", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except subprocess.CalledProcessError:
        # Detached HEAD state or not in a git repo
        return

    if branch_is_main(branch_name):
        if allow_main:
            return
        print("ERROR: Direct commits to main/master branch are disabled.", file=sys.stderr)
        sys.exit(1)

    if not branch_name_is_valid(branch_name):
        print(f"ERROR: Branch name '{branch_name}' is invalid.", file=sys.stderr)
        sys.exit(1)

    with open(commit_msg_filepath, "r", encoding="utf-8") as file:
        commit_msg = file.read()

    branch_type = get_branch_type(branch_name)

    pattern = rf"^{re.escape(branch_type)}(\([A-Za-z\d-]+\))?!?:"

    # Avoid adding duplicate prefix
    if re.match(pattern, commit_msg):
        return

    # Rewrite file with prefixed commit message
    with open(commit_msg_filepath, "w", encoding="utf-8") as file:
        file.write(f"{branch_type}: {commit_msg}")


if __name__ == "__main__":
    main()
