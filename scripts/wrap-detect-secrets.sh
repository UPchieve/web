#!/bin/bash

source "$(dirname "$0")/is-in-container.sh"

# If .venv exists and we're not in a container, use it
if [ -d ".venv" ] && ! is_in_container; then
    echo "Using detect-secrets from .venv"
    source ".venv/bin/activate"
    git diff --staged --name-only -z | xargs -0 detect-secrets-hook --baseline .secrets.baseline --exclude-files package-lock.json
    result=$?
    deactivate
    exit $result
fi

# Otherwise use detect-secrets from PATH
git diff --staged --name-only -z | xargs -0 detect-secrets-hook --baseline .secrets.baseline --exclude-files package-lock.json
