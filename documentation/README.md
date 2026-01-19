# PinnacleSG Documentation

Welcome to the PinnacleSG platform documentation. This folder contains comprehensive documentation for the medical/telemedicine platform.

## Quick Start

| If you want to... | Read this |
|-------------------|-----------|
| Understand the platform | [00-overview.md](./00-overview.md) |
| Set up local development | [02-application-guides.md](./02-application-guides.md) |
| Work on the backend | [07-backend-architecture.md](./07-backend-architecture.md) |
| Work on the frontend | [08-frontend-architecture.md](./08-frontend-architecture.md) |
| Understand the database | [01-db-schema.md](./01-db-schema.md) |
| Configure secrets | [06-credentials-document.md](./06-credentials-document.md) |
| Deploy changes | [10-deployment-environments.md](./10-deployment-environments.md) |
| Write tests | [09-testing-quality.md](./09-testing-quality.md) |
| Debug issues | [11-troubleshooting.md](./11-troubleshooting.md) |

## Document Index

### Architecture & Overview

| Document | Description |
|----------|-------------|
| [00-overview.md](./00-overview.md) | Platform overview, architecture diagrams, technology stack, data flows |
| [07-backend-architecture.md](./07-backend-architecture.md) | FastAPI backend structure, BunJS PDF server, monorepo scripts |
| [08-frontend-architecture.md](./08-frontend-architecture.md) | React Native mobile apps and React web app architecture |

### Database & API

| Document | Description |
|----------|-------------|
| [01-db-schema.md](./01-db-schema.md) | PostgreSQL schema, ERD diagrams, table descriptions, enums |
| [04-api-documentation.md](./04-api-documentation.md) | API endpoints, authentication, client generation |

### Development

| Document | Description |
|----------|-------------|
| [02-application-guides.md](./02-application-guides.md) | Developer workflows, common commands |
| [03-stack-details.md](./03-stack-details.md) | Technology versions, dependencies |
| [06-credentials-document.md](./06-credentials-document.md) | Secrets management with Infisical |
| [09-testing-quality.md](./09-testing-quality.md) | Testing frameworks, code quality, QA processes |
| [11-troubleshooting.md](./11-troubleshooting.md) | Common issues and solutions |

### Integrations & Infrastructure

| Document | Description |
|----------|-------------|
| [05-external-integrations.md](./05-external-integrations.md) | SGiMed, Firebase, Stripe, payment gateways, Zoom, Yuu |
| [10-deployment-environments.md](./10-deployment-environments.md) | Deployment process, environments, CI/CD, rollback |
| [monorepo-sync-setup.md](./monorepo-sync-setup.md) | GitHub Actions sync configuration |

## Platform Components

```
pinnaclesg-monorepo/
├── backend-patient-app/      # FastAPI backend (Python 3.13)
├── backend-bunjs-server/     # BunJS PDF generation (Health Reports)
├── frontend-patient-app/     # Patient mobile app (Expo/React Native)
├── frontend-doctor-app/      # Doctor mobile app (Expo/React Native)
├── frontend-admin-web-ui/    # Admin dashboard (React/Vite)
├── scripts/                  # Monorepo tooling scripts
│   ├── gen-clients.sh        # OpenAPI spec + client generation
│   ├── extract-openapi.py    # FastAPI OpenAPI extractor
│   └── update-all.sh         # Cross-project dependency updates
├── documentation/            # This folder
└── openapi.json              # Generated API specification
```

## Key Technologies

| Layer | Technologies |
|-------|-------------|
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.x, Pydantic v2, APScheduler |
| PDF Service | Bun.js, @react-pdf/renderer, React 19 |
| Mobile | React Native 0.76, Expo 52, TypeScript, NativeWind |
| Web | React 18, Vite 5, Ant Design 5.x, Tailwind CSS |
| Database | PostgreSQL (Supabase), Redis |
| Auth | Firebase (patients), Supabase (admin) |
| Payments | Stripe, NETS Click/QR, 2C2P |
| Healthcare | SGiMed EMR, Yuu Platform, Zoom Video SDK |
| Monitoring | Sentry |

## Common Commands

### Backend
```bash
cd backend-patient-app

# Run server (with secrets)
infisical run --env=staging -- uvicorn main:app --reload

# Database migrations
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "message"

# Run tests
uv run pytest -v

# Lint code
uv run ruff check .
```

### Frontend Mobile
```bash
cd frontend-patient-app  # or frontend-doctor-app

# Start Expo dev server
pnpm start

# Run on iOS/Android
pnpm run ios
pnpm run android

# Generate API client
pnpm run gen-client
```

### Frontend Web
```bash
cd frontend-admin-web-ui

# Start dev server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck

# Generate API client
pnpm run gen-client
```

### BunJS PDF Server
```bash
cd backend-bunjs-server

# Install and run
bun install
bun index.ts

# Test PDF generation
curl -X POST 'http://localhost:4001/api/health-report-pdf' \
  -H 'Authorization: Bearer <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d @test-health-report.json \
  --output test.pdf
```
