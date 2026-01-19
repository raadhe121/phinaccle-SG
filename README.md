# PinnacleSG Monorepo

Monorepo for PinnacleSG medical/telemedicine platform with automated sync to individual repositories.

## Quick Start

### Prerequisites

- [uv](https://github.com/astral-sh/uv) - Python package manager
- [pnpm](https://pnpm.io/) - Node package manager
- [Infisical CLI](https://infisical.com/docs/cli/overview) - Secrets management
- [gh CLI](https://cli.github.com/) - GitHub CLI (optional)

### 1. Clone & Setup

```bash
git clone https://github.com/GRMedicalApp/pinnaclesg-monorepo.git
cd pinnaclesg-monorepo
```

### 2. Run Backend

```bash
cd backend-patient-app
uv sync                                                    # Install dependencies
infisical run --env=staging -- uvicorn main:app --reload   # Start server
```

Backend runs at http://localhost:8000

### 3. Run Frontend (Choose One)

**Admin Dashboard:**
```bash
cd frontend-admin-web-ui
pnpm install
pnpm dev
```
Opens at http://localhost:5173

**Patient App (Expo):**
```bash
cd frontend-patient-app
pnpm install
pnpm start
```
Scan QR with Expo Go app

### 4. Generate API Clients

After backend changes, regenerate frontend SDK:
```bash
./scripts/gen-clients.sh
```

## Repository Structure

```
pinnaclesg-monorepo/
├── backend-patient-app/      # FastAPI backend (Python 3.13)
├── backend-bunjs-server/     # Bun.js PDF generation
├── frontend-patient-app/     # React Native Expo patient app
├── frontend-doctor-app/      # React Native Expo doctor app
├── frontend-admin-web-ui/    # React + Vite admin dashboard
├── scripts/                  # Monorepo tooling
│   ├── gen-clients.sh        # Generate frontend API clients
│   └── extract-openapi.py    # Extract OpenAPI spec
└── openapi.json              # Generated API specification
```

## Development Commands

| Task | Command |
|------|---------|
| Run backend | `cd backend-patient-app && infisical run --env=staging -- uvicorn main:app --reload` |
| Run admin UI | `cd frontend-admin-web-ui && pnpm dev` |
| Run patient app | `cd frontend-patient-app && pnpm start` |
| Run tests | `cd backend-patient-app && uv run pytest` |
| Lint backend | `cd backend-patient-app && uv run ruff check .` |
| DB migration | `cd backend-patient-app && uv run alembic upgrade head` |
| Generate clients | `./scripts/gen-clients.sh` |

## Sync to Individual Repos

Changes pushed to `main` automatically sync to individual repositories via GitHub Actions.

```
Monorepo (main) → GitHub Action → PRs in Individual Repos
```

### Manual Sync

```bash
# Sync all repos
gh workflow run "Sync to Individual Repositories" -f target_repo=all

# Sync specific repo
gh workflow run "Sync to Individual Repositories" -f target_repo=backend-patient-app
```

### Target Repositories

- `GRMedicalApp/backend-patient-app`
- `GRMedicalApp/frontend-patient-app`
- `GRMedicalApp/frontend-doctor-app`
- `GRMedicalApp/frontend-admin-web-ui`
- `GRMedicalApp/backend-bunjs-server`

## Secrets Management

All secrets are managed via Infisical. Never use `.env` files directly:

```bash
# Run any command with secrets injected
infisical run --env=staging -- <command>

# Examples
infisical run --env=staging -- uvicorn main:app --reload
infisical run --env=staging -- uv run pytest
```

## Documentation

- [Backend CLAUDE.md](./backend-patient-app/CLAUDE.md) - Backend architecture & patterns
- [CLAUDE.md](./CLAUDE.md) - Monorepo guidance for AI assistants
