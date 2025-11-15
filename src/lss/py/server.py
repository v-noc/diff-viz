import fastapi_jsonrpc as jsonrpc
from pydantic import BaseModel
from fastapi import Body

from code_parser import parse_code


# Create JSON-RPC application
app = jsonrpc.API()

# Single JSON-RPC entrypoint
api_v1 = jsonrpc.Entrypoint("/api/v1/jsonrpc")


class DemoError(jsonrpc.BaseError):
    CODE = 5000
    MESSAGE = "Demo error"

    class DataModel(BaseModel):
        details: str


@api_v1.method(errors=[DemoError])
def echo(
    data: str = Body(..., examples=["hello"]),
) -> str:
    """
    Demo JSON-RPC method.

    Request:
      {"jsonrpc": "2.0", "method": "echo", "params": {"data": "hello"}, "id": 1}
    Response:
      {"jsonrpc": "2.0", "result": "hello", "id": 1}
    """
    if data == "error":
        raise DemoError(data={"details": "You sent 'error'"})
    return data


@api_v1.method()
def parse_python_code(
    code: str = Body(...),
) -> dict:
    """
    Parse Python code and return its structure (functions, classes, positions).

    JSON-RPC example:

    Request:
      {
        "jsonrpc": "2.0",
        "method": "parse_python_code",
        "params": { "code": "def foo():\\n    pass\\n" },
        "id": 1
      }
    """
    return parse_code(code)


app.bind_entrypoint(api_v1)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="127.0.0.1", port=5000, reload=True)
