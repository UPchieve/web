#!/bin/bash
#
# Scans for committed secrets.
# Runs the scanner in Docker so nobody has to install it locally.
#
#   ./bin/secret_detection.sh check-staged   # pre-commit hook: staged changes only
#   ./bin/secret_detection.sh check-branch   # pre-push hook: the commits in PUSH_COMMITS
#   ./bin/secret_detection.sh pull           # pre-fetches the image
#
set -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

IMAGE="ghcr.io/betterleaks/betterleaks:v1.7.4"

if ! docker info > /dev/null 2>&1; then
 echo "❌ Error: Docker isn't running (or isn't installed)."
 echo "Start Docker and try again."
 exit 1
fi

COMMAND="$1"
shift

if [ "$COMMAND" = "pull" ]; then
 docker pull "$IMAGE"
 exit $?
fi

# The scanner reads history straight from the .git directory.
# In same cases, though, there is no .git directory in the working directory, so we need
# to "find" it, and mount it to the Docker container running the scan:
# - In a git worktree, .git is a _file_.
# - In a jj workspace, .git doesnt exist at all.
if [ -n "${PUSH_GIT_DIR:-}" ]; then
 # Right now, only ever set in bin/jj_pre_push with jj specific commands.
 COMMON_DIR=$PUSH_GIT_DIR
elif git_dir=$(git rev-parse --git-common-dir 2>/dev/null); then
 COMMON_DIR=$(cd "$git_dir" && pwd) || exit 1
else
 echo "❌ Error: not inside a Git repository."
 exit 1
fi

scan() {
 docker run --rm \
  -u "$(id -u):$(id -g)" \
  -v "$PWD:$PWD" \
  -v "$COMMON_DIR:$COMMON_DIR" \
  -w "$PWD" \
  "$IMAGE" "$@" --no-banner --verbose --config .secret-detection.toml
}

case "$COMMAND" in
 check-staged)
 scan git --staged "$@"
 ;;
 check-branch)
 # The pre-push hook is the only thing that knows which commits are actually
 # being pushed, and has exported those refs to PUSH_COMMITS.
 if [ -z "${PUSH_COMMITS:-}" ]; then
  echo "❌ Error: PUSH_COMMITS is not set."
  echo "Run this through the pre-push hook rather than on its own."
  exit 1
 fi

 # `--no-walk` keeps git from following ancestry. The commit list is already
 # _exactly_ what needs scanning, and ancestors are on the remote already.
 #
 # The scan is pointed at the .git directory (i.e. COMMON_DIR) rather than at $PWD,
 # because a git worktree/jj workspace has no .git of its own, but we know the
 # state exists in .git directory because we've already committed at this point.
 output=$(scan git "$COMMON_DIR" --log-opts="--no-walk=unsorted $PUSH_COMMITS" "$@" 2>&1)
 status=$?
 echo "$output"
 exit $status
 ;;
 *)
 echo "❌ Error: Unknown command '$COMMAND'"
 echo "Valid commands: check-staged, check-branch, pull"
 exit 1
 ;;
esac
