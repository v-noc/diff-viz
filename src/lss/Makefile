LSS_PY_DIR=py
LSS_TS_DIR=ts
LSS_JS_DIR=js

.PHONY: help
help:
	@echo "LSS workspace commands:"
	@echo "  make py-install   Install Python deps for lss/py"
	@echo "  make py-dev       Run Python JSON-RPC server for lss/py"

.PHONY: py-install
py-install:
	cd $(LSS_PY_DIR) && uv sync

.PHONY: py-dev
py-dev:
	cd $(LSS_PY_DIR) && python -m uvicorn server:app --reload --host 0.0.0.0 --port 5000


