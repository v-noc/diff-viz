"""
Language service configuration.

This centralises how we talk to external code-structure parsers for
different languages. Each entry describes:

- ``method``: JSON‑RPC method name
- ``port``: TCP port the service listens on
- ``extensions``: list of file extensions handled by this language
"""

from typing import Dict, List, TypedDict


class LanguageConfigEntry(TypedDict):
    method: str
    port: int
    extensions: List[str]


LANGUAGE_CONFIG: Dict[str, LanguageConfigEntry] = {
    # Python code – parsed by the lss/py JSON‑RPC server in src/lss/py/server.py
    "python": {
        "method": "parse_python_code",
        "port": 5000,
        "extensions": [".py"],
    },
    # TypeScript code – parsed by the lss/js JSON‑RPC server in src/lss/js/index.ts
    "typescript": {
        "method": "parse_typescript_code",
        "port": 5001,
        "extensions": [".ts", ".tsx"],
    },
    # JavaScript code – parsed by the lss/js JSON‑RPC server in src/lss/js/index.ts
    "javascript": {
        "method": "parse_javascript_code",
        "port": 5001,
        "extensions": [".js", ".jsx"],
    },
}


