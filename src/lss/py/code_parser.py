import ast
from typing import Dict


def parse_code(code: str) -> Dict[str, dict]:
    """
    Parse Python source code into an AST and extract the source text of
    all functions and classes (including nested ones), along with their types.

    The result mirrors `backend.core.diff_parser.parse_code_structure` and is
    a mapping of qualified names to metadata, for example:

    - ``foo``          – top‑level function
    - ``Foo``          – top‑level class
    - ``Foo.bar``      – method ``bar`` inside class ``Foo``
    - ``main.inner``   – nested function ``inner`` inside ``main``
    """
    structure: Dict[str, dict] = {}
    if not code:
        return structure

    try:
        tree = ast.parse(code)

        def visit(node: ast.AST, parents: list[str]) -> None:
            for child in ast.iter_child_nodes(node):
                if isinstance(
                    child,
                    (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef),
                ):
                    node_type = "class" if isinstance(
                        child, ast.ClassDef
                    ) else "function"

                    qualname_parts = parents + [child.name]
                    qualname = ".".join(qualname_parts)

                    structure[qualname] = {
                        "type": node_type,
                        "source": ast.get_source_segment(code, child),
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

                    visit(child, qualname_parts)
                else:
                    visit(child, parents)

        visit(tree, [])

    except (SyntaxError, TypeError):
        # Gracefully handle files that are not valid Python
        pass

    return structure
