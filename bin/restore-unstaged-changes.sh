# Restores any unstaged changes in the working tree after the commit is made, ensuring
# that the unlinted version will always be in the working tree
git checkout stash -- .
git stash drop -q