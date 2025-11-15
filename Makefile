PY_BACKEND_DIR=src/backend
FRONTEND_DIR=src/frontend
LSS_DIR=src/lss

.PHONY: help
help:
	@echo "Monorepo commands:"
	@echo "  make install-backend   Install Python deps with uv"
	@echo "  make run-backend       Run the Python backend app"
	@echo "  make install-frontend  Install frontend deps with yarn"
	@echo "  make dev-frontend      Start React dev server"
	@echo "  make build-frontend    Build React app"
	@echo "  make lss-<target>      Run target from src/lss/Makefile (e.g. lss-py-dev)"

.PHONY: install-backend
install-backend:
	cd $(PY_BACKEND_DIR) && uv sync

.PHONY: run-backend
run-backend:
	cd $(PY_BACKEND_DIR) && uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: install-frontend
install-frontend:
	cd $(FRONTEND_DIR) && yarn install

.PHONY: dev-frontend
dev-frontend:
	cd $(FRONTEND_DIR) && yarn dev

.PHONY: build-frontend
build-frontend:
	cd $(FRONTEND_DIR) && yarn build

.PHONY: lss-%
lss-%:
	$(MAKE) -C $(LSS_DIR) $*


