# Testing & Quality Assurance

This document covers testing practices, code quality tools, and quality assurance processes for the PinnacleSG platform.

## Testing Overview

| Component | Framework | Location |
|-----------|-----------|----------|
| Backend | pytest | `backend-patient-app/tests/` |
| Patient App | Jest + React Native Testing Library | `frontend-patient-app/__tests__/` |
| Doctor App | Jest | `frontend-doctor-app/__tests__/` |
| Admin Web | Vitest (optional) | `frontend-admin-web-ui/src/__tests__/` |

## Backend Testing

### Test Framework

The backend uses **pytest** with async support for FastAPI testing.

### Running Tests

```bash
cd backend-patient-app

# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_appointment.py -v

# Run specific test function
uv run pytest tests/test_appointment.py::test_booking_flow -v

# Run with coverage
uv run pytest --cov=. --cov-report html

# Run with verbose output
uv run pytest -v --tb=short
```

### Test Structure

```
backend-patient-app/tests/
├── conftest.py              # Shared fixtures
├── test_appointment.py      # Appointment tests
├── test_teleconsult.py      # Teleconsult tests
├── test_auth.py             # Authentication tests
├── test_payment.py          # Payment tests
└── test_integration/        # Integration tests
    └── test_sgimed.py
```

### Test Fixtures

```python
# conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    """Create a test database session."""
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def client(db_session):
    """Create a test client with mocked database."""
    from main import app
    from models import get_db

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def authenticated_client(client):
    """Client with valid authentication token."""
    # Mock Firebase token validation
    return client
```

### Writing Tests

```python
# test_appointment.py
import pytest
from datetime import datetime, timedelta

class TestAppointmentBooking:
    def test_get_available_slots(self, client):
        """Test fetching available appointment slots."""
        response = client.get(
            "/api/appointment/v1/slots",
            params={
                "branch_id": "test-branch-id",
                "date": "2024-01-15"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "slots" in data
        assert isinstance(data["slots"], list)

    def test_book_appointment(self, authenticated_client, db_session):
        """Test booking an appointment."""
        booking_data = {
            "branch_id": "test-branch-id",
            "service_id": "test-service-id",
            "start_datetime": "2024-01-15T10:00:00"
        }
        response = authenticated_client.post(
            "/api/appointment/v1/book",
            json=booking_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "appointment_id" in data

    def test_booking_requires_authentication(self, client):
        """Test that booking requires authentication."""
        response = client.post("/api/appointment/v1/book", json={})
        assert response.status_code == 401
```

### CLI Testing Tools

The backend includes CLI tools for manual testing:

```bash
# Test service group CRUD operations
uv run cli/service_group_tester.py test-crud

# Test corporate codes
uv run cli/corporate_code_tester.py test-crud

# Test services
uv run cli/service_tester.py test-crud

# Test branch configuration
uv run cli/onsite_branch_tester.py test-crud
```

---

## Frontend Testing

### Patient App (Jest)

```bash
cd frontend-patient-app

# Run all tests
pnpm test

# Run in watch mode
pnpm test --watch

# Run with coverage
pnpm test --coverage
```

**Test Configuration (jest.config.js):**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

**Example Component Test:**
```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} />);
    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Admin Web UI (Vitest)

```bash
cd frontend-admin-web-ui

# Run tests
pnpm test

# Run with UI
pnpm test --ui
```

---

## Code Quality

### Backend (Ruff)

The backend uses **Ruff** for linting and formatting.

```bash
cd backend-patient-app

# Run linter
uv run ruff check .

# Auto-fix issues
uv run ruff check . --fix

# Format code
uv run ruff format .
```

**Configuration (ruff.toml):**
```toml
line-length = 88
target-version = "py313"

[lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "C4"]
ignore = ["E501"]

[lint.isort]
known-first-party = ["models", "routers", "services", "utils"]
```

### Frontend (ESLint + Prettier)

```bash
cd frontend-patient-app  # or other frontend

# Run ESLint
pnpm lint

# Fix ESLint issues
pnpm lint --fix

# Format with Prettier
pnpm format
```

### TypeScript Checking

```bash
# Frontend admin
cd frontend-admin-web-ui
pnpm typecheck

# Mobile apps (via Expo)
cd frontend-patient-app
npx tsc --noEmit
```

---

## Type Safety

### Backend (Pydantic + Type Hints)

All functions require type hints:

```python
# Good
async def get_appointment(
    appointment_id: UUID,
    db: Session
) -> AppointmentResponse:
    ...

# Bad - missing type hints
async def get_appointment(appointment_id, db):
    ...
```

### Frontend (TypeScript Strict Mode)

TypeScript strict mode is enabled:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Avoid:**
- `any` type - use specific types or generics
- `unknown` type - use proper types
- Type assertions (`as any`, `as unknown`)

---

## API Contract Testing

### OpenAPI Validation

The generated OpenAPI spec serves as a contract:

```bash
# Generate fresh spec
cd backend-patient-app
uvicorn main:app --port 8000 &
curl http://localhost:8000/openapi.json > ../openapi.json

# Regenerate clients
cd ../frontend-patient-app
pnpm run gen-client
```

### Type-Safe Client Usage

```typescript
// The generated client provides compile-time safety
import { AppointmentService } from './services/client';

// TypeScript will error if parameters don't match
const response = await AppointmentService.bookAppointment({
  requestBody: {
    branchId: 'uuid',  // Type-checked
    serviceId: 'uuid', // Type-checked
    startDatetime: '2024-01-15T10:00:00' // Type-checked
  }
});
```

---

## Integration Testing

### Database Testing

```python
# Use test database for integration tests
@pytest.fixture(scope="session")
def test_database():
    """Create a test database."""
    # Use separate test database
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
```

### External Service Mocking

```python
# Mock SGiMed API calls
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_sgimed():
    with patch('utils.integrations.sgimed.SGiMedClient') as mock:
        mock_client = MagicMock()
        mock_client.get_patient.return_value = {
            'id': 'patient-123',
            'name': 'Test Patient'
        }
        mock.return_value = mock_client
        yield mock_client
```

---

## Pre-commit Hooks

Consider adding pre-commit hooks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: ruff
        name: ruff
        entry: uv run ruff check --fix
        language: system
        types: [python]
        files: ^backend-patient-app/

      - id: ruff-format
        name: ruff-format
        entry: uv run ruff format
        language: system
        types: [python]
        files: ^backend-patient-app/
```

---

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - name: Install dependencies
        run: |
          cd backend-patient-app
          uv sync
      - name: Run tests
        run: |
          cd backend-patient-app
          uv run pytest --cov=. --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - name: Install dependencies
        run: |
          cd frontend-patient-app
          pnpm install
      - name: Run tests
        run: |
          cd frontend-patient-app
          pnpm test --coverage
```

---

## Manual QA Checklist

### Before Release

- [ ] All automated tests pass
- [ ] Manual smoke test on staging
- [ ] Test critical flows:
  - [ ] Patient registration/login
  - [ ] Appointment booking
  - [ ] Teleconsult join
  - [ ] Payment processing
- [ ] Check Sentry for new errors
- [ ] Verify API response times
- [ ] Test on iOS and Android devices

### Mobile App Testing

- [ ] Test on different screen sizes
- [ ] Test offline behavior
- [ ] Test push notifications
- [ ] Test deep links
- [ ] Verify app permissions

---

**Last Updated**: 2026-01-16
