PY_BACKEND_DIR=src/backend
FRONTEND_DIR=src/frontend

.PHONY: help
help:
	@echo "Monorepo commands:"
	@echo "  make install-backend   Install Python deps with uv"
	@echo "  make run-backend       Run the Python backend app"
	@echo "  make install-frontend  Install frontend deps with yarn"
	@echo "  make dev-frontend      Start React dev server"
	@echo "  make build-frontend    Build React app"

.PHONY: install-backend
install-backend:
	cd $(PY_BACKEND_DIR) && uv sync

.PHONY: run-backend
run-backend:
	cd $(PY_BACKEND_DIR) && uv run python hello.py

.PHONY: install-frontend
install-frontend:
	cd $(FRONTEND_DIR) && yarn install

.PHONY: dev-frontend
dev-frontend:
	cd $(FRONTEND_DIR) && yarn dev

.PHONY: build-frontend
build-frontend:
	cd $(FRONTEND_DIR) && yarn build


