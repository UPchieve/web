# Git Workflow



## Contents

1. [Overview](#overview)
1. [Naming Convention](#naming-Convention)
1. [PR Convention](#pr-Convention)
1. [FAQs](#faqs)



## Overview

1. Create a new branch following the [name convention](#name-convention).
2. Work on your branch until the task is done.
3. Make sure that your code works and that it complies with [the standards](CODING_STANDARDS.md).
4. Update the documentation if needed.
5. Submit a PR to be [merged **to the `dev` branch**](https://stackoverflow.com/a/38985999), making sure to comply with the [PR convention](#pr-convention).
6. Make changes to the PR if requested by the reviewer(s).
7. Once the PR is approved, it gets merged to `dev`, which is the branch deployed on our test server.
8. If we find an error on the test server, a new *issue* with the label *bug* is created and assigned to you (and then we go through steps 1-7 with the fix).
9. If the new edits deploy smoothly on the test server, then they get merged to `master`, which is the branch of the live server. FIN :raised_hands:

**[⬆ back to top](#contents)**



## Naming Convention

- Use `dash-case` for branch names.
- Prefix all feature branches with `feat/`:
  ```
  feat/new-onboarding
  feat/reward-system
  feat/new-awesome-chat
  ```
- Prefix all fix branches with `fix/`:
  ```
  fix/bug#22-in-home-view
  fix/training-refactoring
  fix/training-view-bugs
  ```
- Branches for edits to the documentation that are not linked to a particular bug or feature don't require a prefix.
- Special branches like `master` and `dev` don't require prefixes either.

**[⬆ back to top](#contents)**



## PR Convention

- **Keep your PRs clean**, only submit them after making sure that you're complying with our [coding standards](CODING_STANDARDS.md) (run the linter).
- **Don't mix** fix PRs with feature PRs.
- **Always assign a reviewer**. If you're unsure about whom to ask, then just assign the review to the Director of Technology.
- **Always explain the edits** you're submitting.

**[⬆ back to top](#contents)**



## FAQs

- **Should we delete or keep old branches?**: we're keeping them for now.
- **Can I use emojis in my commits?**: yes, as long as you don't overdo it.

**[⬆ back to top](#contents)**