import ast
from typing import Dict


def parse_code_structure(source_code: str) -> Dict[str, dict]:
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
    """
    structure: Dict[str, dict] = {}
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


