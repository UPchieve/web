#!/bin/bash
#
# Runs the npm scripts listed under a hook's key in package.json, in order,
# stopping at the first failure.
#
# Example usage for pre-commit (for any other hook, just swap out the arg):
#   ./bin/run_git_hook.sh pre-commit
set -uo pipefail

hook_name="${1:-}"
if [ -z "$hook_name" ]; then
  echo "git-hooks: missing hook-name" >&2
  exit 1
fi
shift

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

if ! tasks=$(node -p "(require('./package.json')['$hook_name'] || []).join('\n')" 2>/dev/null); then
  echo "git-hooks: could not read \"$hook_name\" from package.json" >&2
  exit 1
fi

# Each task right now separately gets the files it wants for whatever lint check it
# performs. If we wanted, we could instead get all the files first (e.g. on
# pre-commit, get staged files), and pass that list of files into each task.
for task in $tasks; do
  printf '\n[%s] pnpm run %s\n' "$hook_name" "$task"

  pnpm run --silent "$task"

  status=$?
  if [ $status -ne 0 ]; then
    printf '\n[%s] "%s" failed\n' "$hook_name" "$task" >&2
    exit $status
  fi
done
