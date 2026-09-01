#!/bin/bash
#
# The following is run by the `prepare` pnpm script on install.
# It changes where git "looks" for hooks (i.e. into version-controlled `.githooks`).
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

# If you don't have a .git directory (like in a jj workspace :) ), just skip
# setting up the git hooks.
# jj users will have their own solution for executing git hooks.
if [ ! -e .git ]; then
  echo "git-hooks: skipping git hook install because no .git directory found."
  exit 0
fi

if [ ! -x .githooks/pre-commit ]; then
  echo "git-hooks: .githooks/pre-commit is missing or not executable." >&2
  exit 1
fi

if [ ! -x .githooks/pre-push ]; then
  echo "git-hooks: .githooks/pre-push is missing or not executable." >&2
  exit 1
fi

if ! git config core.hooksPath .githooks; then
  echo "git-hooks: FAILED to set core.hooksPath. Hooks are NOT installed." >&2
  exit 1
fi

echo "git-hooks: successfully setup git hooks!"
