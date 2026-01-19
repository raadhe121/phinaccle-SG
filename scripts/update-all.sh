#!/bin/bash

# List of directories to update
REPOS=(
    "backend-bunjs-server"
    "backend-patient-app"
    "frontend-admin-web-ui"
    "frontend-doctor-app"
    "frontend-patient-app"
)

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting pnpm update across all relevant repositories..."
echo "Root directory: $ROOT_DIR"

for repo in "${REPOS[@]}"; do
    REPO_PATH="$ROOT_DIR/$repo"
    
    if [ -d "$REPO_PATH" ]; then
        if [ -f "$REPO_PATH/package.json" ]; then
            echo "------------------------------------------------------------"
            echo "Updating $repo..."
            cd "$REPO_PATH" || continue
            pnpm update
        else
            echo "------------------------------------------------------------"
            echo "Skipping $repo (no package.json found)"
        fi
    else
        echo "------------------------------------------------------------"
        echo "Skipping $repo (directory not found)"
    fi
done

echo "------------------------------------------------------------"
echo "All updates completed!"
