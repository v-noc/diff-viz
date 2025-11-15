FastAPI JSON-RPC demo server for the `lss/py` project.

## Run

- Using `uv` from this directory:

```bash
uv run server.py
```

Or with plain Python (after installing deps into an environment):

```bash
python server.py
```

The server listens on `http://127.0.0.1:5000`.

## Example JSON-RPC request

POST to `http://127.0.0.1:5000/api/v1/jsonrpc` with:

```json
{
  "jsonrpc": "2.0",
  "method": "echo",
  "params": { "data": "hello" },
  "id": 1
}
```

Expected response:

```json
{
  "jsonrpc": "2.0",
  "result": "hello",
  "id": 1
}
```

