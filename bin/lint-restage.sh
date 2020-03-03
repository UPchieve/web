# Lints staged files by stashing any unstaged changes, then linting, then popping the
# stash
# See https://codeinthehole.com/tips/tips-for-using-a-git-pre-commit-hook/
git stash -q --keep-index
npm run lint && git add -u