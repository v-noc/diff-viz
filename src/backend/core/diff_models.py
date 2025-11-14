from typing import List

from pydantic import BaseModel, Field


class CodePosition(BaseModel):
    start_line: int
    end_line: int
    start_column: int
    end_column: int


class ProjectTreeNode(BaseModel):
    id: str
    label: str
    kind: str
    # High‑level change status for the node/file.
    status: str = "unchanged"
    # Location of the node in the (new) source file.
    code_position: CodePosition
    # Repository‑relative file path.
    path: str
    # Child nodes (e.g. methods inside a class).
    children: List["ProjectTreeNode"] = Field(default_factory=list)
    # Unified diff text (git‑style) for this node or file.
    source: str = ""


def make_code_position(def_info: dict) -> CodePosition:
    """Safely construct a CodePosition from parsed definition info."""
    return CodePosition(
        start_line=def_info.get("start_line", 0),
        end_line=def_info.get("end_line", 0),
        start_column=def_info.get("start_column", 0),
        end_column=def_info.get("end_column", 0),
    )


