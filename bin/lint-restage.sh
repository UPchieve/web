# Lints staged files by stashing any unstaged changes, then linting, then popping the
# stash
# See https://codeinthehole.com/tips/tips-for-using-a-git-pre-commit-hook/
git stash -q --keep-index
npm run lint
RESULT=$?

# stage the automatic fixes
git add -u

# restore original unstaged files if errors occurred
if [ $RESULT -ne 0 ]; then
  git stash pop -q
fi

# ensure commit fails if lint could not fix everything
[ $RESULT -ne 0 ] && exit 1
exit 0
