.PHONY: backend pytest vitest cypress lint test frontend venv install

HOST ?= 0.0.0.0
PORT ?= 5001
RELOAD_FLAG ?= --reload

# Start the backend server using Uvicorn
backend:
	cd backend && python3 -m uvicorn app.main:app --host $(HOST) --port $(PORT) $(RELOAD_FLAG)

# Start the frontend development server
frontend:
	cd frontend && npm run dev

# Run Python tests with pytest
pytest:
	cd backend && pytest

# Run Python tests with coverage report
pytest-cov:
	pytest --cov=backend/app --cov-report=term-missing

# Run Vitest tests in frontend
vitest:
	cd frontend && NODE_OPTIONS='--max-old-space-size=8192' npx vitest run

vitest-cov:
	cd frontend && NODE_OPTIONS='--max-old-space-size=8192' npx vitest run --coverage

# Run Cypress tests in frontend
cypress:
	cd frontend && npx cypress run

# Run linters for backend and frontend
lint:
	black backend
	cd frontend && npx prettier --write .

# Run all frontend tests and lint
test:
	$(MAKE) vitest
	$(MAKE) cypress
	$(MAKE) lint

# Create Python virtual environment
venv:
	python3 -m venv venv

# Install backend and frontend dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Clean up Python cache files and frontend build artifacts
clean:
	rm -rf backend/__pycache__ backend/app/__pycache__ backend/app/models/__pycache__ backend/app/routes/__pycache__ backend/app/services/__pycache__ backend/app/utils/__pycache__ frontend/dist

# Format backend and frontend code
check:
	$(MAKE) pytest
	$(MAKE) vitest
	$(MAKE) cypress
	black --check backend
	cd frontend && npx prettier --check .

# Start both backend and frontend servers
start:
	$(MAKE) install
	$(MAKE) backend &
	$(MAKE) frontend