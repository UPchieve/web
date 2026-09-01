#!/bin/bash
#
# Pre-Push Git Hook for `jj`.
#
# jj _still_ has no hook system of its own.
#
# This pre push script gets invoked by the following shim you need to add to your ~/.bashrc, which turns
# `jj git push <args>` into `bin/jj_pre_push.sh <args>`:
#
# ```
# jj() {
#     if [ "$1" = "git" ] && [ "$2" = "push" ] && [ -z "${JJ_PRE_PUSH:-}" ]; then
#         local root hook
#         root="$(command jj workspace root 2>/dev/null)" || { command jj "$@"; return; }
#         hook="$root/bin/jj_pre_push.sh"
#         if [ -x "$hook" ]; then
#             shift 2
#             JJ_PRE_PUSH=1 "$hook" "$@"
#             return
#         fi
#     fi
#     command jj "$@"
# }
# ```
#
# Every jj command lives in this script. bin/secret_detection.sh gets what it
# needs through PUSH_COMMITS and PUSH_GIT_DIR, so it never has to know about jj.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

# We use `--dry-run` below to figure out what _would_ be pushed.
# If the initial `jj git push` was invoked with `--dry-run`, we'd end up with two
# `--dry-run --dry-run` in the command below, which will fail in jj.
plan_args=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) ;;
    *) plan_args+=("$arg") ;;
  esac
done

plan=$(jj git push --dry-run "${plan_args[@]}" 2>&1)
if [ $? -ne 0 ]; then
  echo 'jj_pre_push: failed on dry-run' >&2
  printf '%s\n' "$plan" >&2
  exit 1
fi

# The dry run outputs which remote we are pushing to as "Changes to push to ...",
# but just default to origin otherwise (we aren't pushing anywhere else right now,
# anyways).
remote=$(printf '%s\n' "$plan" | sed -n 's/^Changes to push to \(.*\):$/\1/p')
[ -z "$remote" ] && remote=origin

# The dry run reports each bookmark commit (basically, the last commit of a branch)
# with "... to <commit id>".
heads=$(printf '%s\n' "$plan" | grep -oE ' to [0-9a-f]{7,64}' | awk '{print $2}' | paste -sd'|' -)

if [ -n "$heads" ]; then
  # All the commits in the chain from those heads being pushed, minus everything the remote already has.
  commits=$(jj --ignore-working-copy log --no-graph \
    -r "::($heads) ~ ::remote_bookmarks(remote=exact:'$remote')" \
    -T 'commit_id ++ " "') || exit 1

  if [ -n "$commits" ]; then
    # A jj workspace has no .git of its own, so the scanner has to be
    # told where the real .git directory lives.
    git_dir=$(jj --ignore-working-copy git root) || exit 1

    export PUSH_COMMITS="$commits"
    export PUSH_GIT_DIR="$git_dir"

    ./bin/run_git_hook.sh pre-push || exit $?
  fi
fi

exec jj git push "$@"
