## Monorepo: Python Backend (uv) + React Frontend (Vite)

This repo contains:
- `src/backend` — Python backend managed by **uv**
- `src/frontend` — React + TypeScript + Vite frontend

### Requirements

- Python >= 3.12
- [uv](https://docs.astral.sh/uv/) installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js + Corepack (or Yarn) for the frontend

### Backend (Python with uv)

From the repo root:

```bash
make install-backend   # install backend dependencies with uv
make run-backend       # run the backend app
```

Inside `src/backend` you can also use uv directly, for example:

```bash
cd src/backend
uv sync               # create/update the virtual env
uv run python hello.py
```

Backend entry point: `hello.py` (simple "Hello from backend!" script for now).

### Frontend (React + Vite)

From the repo root:

```bash
make install-frontend  # install frontend dependencies with yarn
make dev-frontend      # start Vite dev server
make build-frontend    # build frontend for production
```

Or from `src/frontend`:

```bash
cd src/frontend
yarn install
yarn dev
```

### Monorepo Layout

- `src/backend` — Python backend, configured via `pyproject.toml` and managed with uv
- `src/frontend` — React + TypeScript app using Vite
- `Makefile` — convenience commands for working with both projects


