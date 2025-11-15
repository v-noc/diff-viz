import json
import urllib.request
from typing import Dict

from .language_config import LANGUAGE_CONFIG


def parse_code_structure(source_code: str, language: str) -> Dict[str, dict]:
    """
    Parse Python source code into a structured representation.

    First, this tries to delegate to the external JSON-RPC parser
    (the `parse_python_code` method exposed by the lss/py service).
    If that call fails for any reason, it falls back to local AST parsing.

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

    # Try JSON-RPC parser first
    lang_cfg = LANGUAGE_CONFIG[language]
    method = lang_cfg["method"]
    port = lang_cfg["port"]
    try:
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": {"code": source_code},
            "id": 1,
        }
        req = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/v1/jsonrpc",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            response_data = json.load(resp)
            print(response_data)

        if isinstance(response_data, dict) and "result" in response_data:
            result = response_data["result"]
            if isinstance(result, dict):
                return result
    except Exception as e:
        print(f" Failed to parse code structure: {e} {port} {method} ")
        # If remote parsing fails, fall back to local AST logic below.
        pass

    return structure
