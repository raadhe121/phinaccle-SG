#!/usr/bin/env python3
"""
Extract OpenAPI schema from FastAPI application.

Usage:
    python scripts/extract-openapi.py main:app --app-dir backend-patient-app --out openapi.json
"""
import argparse
import json
import sys

parser = argparse.ArgumentParser(prog="extract-openapi.py")
parser.add_argument("app", help='App import string. Eg. "main:app"', default="main:app")
parser.add_argument("--app-dir", help="Directory containing the app", default=None)
parser.add_argument("--out", help="Output file ending in .json or .yaml", default="openapi.json")

if __name__ == "__main__":
    args = parser.parse_args()

    if args.app_dir is not None:
        print(f"Adding {args.app_dir} to sys.path")
        sys.path.insert(0, args.app_dir)

    print(f"Importing app from {args.app}")
    from uvicorn.importer import import_from_string

    app = import_from_string(args.app)
    openapi = app.openapi()
    version = openapi.get("openapi", "unknown version")

    print(f"Writing OpenAPI spec v{version}")
    with open(args.out, "w") as f:
        if args.out.endswith(".json"):
            json.dump(openapi, f, indent=2)
        else:
            try:
                import yaml
                yaml.dump(openapi, f, sort_keys=False)
            except ImportError:
                print("PyYAML not installed, falling back to JSON")
                json.dump(openapi, f, indent=2)

    print(f"Spec written to {args.out}")
