# Credentials Document

Credentials and environment variables are managed securely via **Infisical**.

## Secrets Management Policy
- **No .env files**: Secrets are NOT committed to the repository or stored in local files.
- **Centralized Storage**: All environment-specific variables are stored in the Infisical workspace.

## Workspace Details
- **Workspace ID**: `f8db51c9-7fe0-4438-84d2-00ee468fa948` (Ref: [.infisical.json](file:///Users/jx/Documents/Codes/GRMedicalApp/_modules/250315_appointment/main/backend-patient-app/monorepo/pinnaclesg-monorepo/.infisical.json))

## Developer Usage
To run any service locally with the required secrets, prepended the command with `infisical run`:

```bash
# Backend (Staging)
infisical run --env=staging -- uvicorn main:app

# Monorepo Scripts
infisical run --env=production -- ./scripts/custom-script.sh
```

## Setup
1. [Login to Infisical](https://app.infisical.com/)
2. Request access to the `GRMedicalApp` workspace.
3. Install the Infisical CLI on your machine.
