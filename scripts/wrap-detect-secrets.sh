#!/bin/bash

# Check for Python 3 (hard requirement)
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Auto-setup if needed by calling the setup script
if [ ! -d ".venv" ] || [ ! -f ".venv/bin/detect-secrets" ]; then
    "$(dirname "$0")/setup-detect-secrets.sh"
fi

# Get the command from first argument
COMMAND="$1"
shift  # Remove first argument, keep the rest

case "$COMMAND" in
    scan)
        .venv/bin/detect-secrets scan --baseline .secrets.baseline --exclude-files pnpm-lock.yaml "$@"
        ;;
    audit)
        .venv/bin/detect-secrets audit .secrets.baseline "$@"
        ;;
    hook)
        git diff --staged --name-only -z | xargs -0 .venv/bin/detect-secrets-hook --baseline .secrets.baseline --exclude-files pnpm-lock.yaml "$@"
        ;;
    *)
        echo "❌ Error: Unknown command '$COMMAND'"
        echo "Valid commands: scan, audit, hook"
        exit 1
        ;;
esac
