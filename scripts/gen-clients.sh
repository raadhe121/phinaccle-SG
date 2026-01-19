#!/bin/bash
# Generate frontend SDK clients from OpenAPI spec
# Usage: ./scripts/gen-clients.sh
#
# Prerequisites:
# - uv (Python package manager)
# - pnpm (Node package manager)
# - infisical CLI (for secrets management)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OPENAPI_FILE="$ROOT_DIR/openapi.json"

echo "=== OpenAPI Client Generator ==="
echo ""

# Step 1: Extract OpenAPI spec from backend
echo "Step 1: Extracting OpenAPI spec from backend-patient-app..."
cd "$ROOT_DIR/backend-patient-app"

# Extract OpenAPI using uv with infisical for secrets
infisical run --env=staging -- uv run python "$SCRIPT_DIR/extract-openapi.py" main:app --app-dir . --out "$OPENAPI_FILE"

echo ""
echo "OpenAPI spec saved to: $OPENAPI_FILE"
echo ""

# Step 2: Generate clients for each frontend
echo "Step 2: Generating frontend clients..."
echo ""

# Frontend Patient App
if [ -d "$ROOT_DIR/frontend-patient-app" ]; then
    echo "Generating client for frontend-patient-app..."
    cd "$ROOT_DIR/frontend-patient-app"
    if [ -f "package.json" ]; then
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
        pnpm exec openapi-ts --input "$OPENAPI_FILE" --output ./services/client --client axios
        echo "  ✓ frontend-patient-app client generated"
    fi
fi

# Frontend Admin Web UI
if [ -d "$ROOT_DIR/frontend-admin-web-ui" ]; then
    echo "Generating client for frontend-admin-web-ui..."
    cd "$ROOT_DIR/frontend-admin-web-ui"
    if [ -f "package.json" ]; then
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
        pnpm exec openapi-ts --input "$OPENAPI_FILE" --output ./src/services/client --client axios
        echo "  ✓ frontend-admin-web-ui client generated"
    fi
fi

# Frontend Doctor App
if [ -d "$ROOT_DIR/frontend-doctor-app" ]; then
    echo "Generating client for frontend-doctor-app..."
    cd "$ROOT_DIR/frontend-doctor-app"
    if [ -f "package.json" ] && grep -q "openapi-ts\|@hey-api" package.json 2>/dev/null; then
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
        pnpm exec openapi-ts --input "$OPENAPI_FILE" --output ./services/client --client axios
        echo "  ✓ frontend-doctor-app client generated"
    else
        echo "  ⚠ frontend-doctor-app has no openapi-ts dependency, skipping"
    fi
fi

echo ""
echo "=== Client generation complete ==="
echo ""
echo "Generated files:"
echo "  - openapi.json (root)"
if [ -d "$ROOT_DIR/frontend-patient-app/services/client" ]; then
    echo "  - frontend-patient-app/services/client/"
fi
if [ -d "$ROOT_DIR/frontend-admin-web-ui/src/services/client" ]; then
    echo "  - frontend-admin-web-ui/src/services/client/"
fi
