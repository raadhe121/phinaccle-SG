# Application Guides

This document provides architectural guidance and developer workflows for the PinnacleSG monorepo.

## Architectural Patterns

### Backend (FastAPI)
- **RORO Pattern**: Receive Object, Return Object methodology for consistency.
- **Layered Structure**:
    - **Routers**: API endpoints categorized by user type (`patient`, `doctor`, `admin`).
    - **Services**: Business logic layer.
    - **Repository**: Data access layer using SQLAlchemy.
    - **Models**: Pydantic schemas for validation and SQLAlchemy ORMs for DB mappings.
- **Background Jobs**: Uses APScheduler for crons and background tasks like SGiMed sync.

### Frontend (React Native & React)
- **API Clients**: Auto-generated via `@hey-api/openapi-ts` from the backend `openapi.json`.
- **State Management**: TanStack Query (React Query) for server state handling.
- **Styling**: Tailwind CSS (NativeWind for mobile) for utility-first styling.
- **Routing**: Expo Router for mobile apps; React Router for the admin dashboard.

## Common Developer Commands

### Backend Workflows
```bash
# Run server with Infisical secrets
infisical run --env=staging -- uvicorn main:app --reload

# Database Migrations (Alembic)
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "description"

# Run Tests
uv run pytest
```

### Frontend Workflows
```bash
# Start Expo (Mobile)
pnpm start

# Generate API Client (Admin or Mobile)
pnpm run gen-client

# Vite Dev (Admin)
pnpm dev
```

## Secrets Management
Secrets are never stored in `.env` files. Access is managed through **Infisical**:
```bash
infisical run --env=staging -- <command>
```
