# Introduction

Thanks for contributing to the UPchieve high-line project. We really appreciate your help, and thank you for the effort you're putting in. In this document you can find out how to: create your own repository, test your additions, and propose your updated code to the UPchieve team. For detailed information about how to install and start servers, see the [README.md](README.md) file.

## Joining the community

Our open source community chats in our Slack org, and we have a weekly Zoom meeting Wednesday nights at 8:30PM ET. To get invites to both,
please [sign up here](https://upchieve.org/opensource)!

## GITLAB

NOTE: Active development on this project has moved to https://gitlab.com/upchieve/application/high-line, no more pushes should go straight to the Github repo.

## Creating your Repository and Workspace

You should create your own repository and contribute work to this project, so you can track, branch, and test your own code. To do this:

1. If you haven't already, create an account at GitLab. You can use your GitHub account to log in for the first time. Setup your ssh keys to GitLab on your local machine here: https://gitlab.com/-/profile/keys.
1. Click the "Fork" button at https://gitlab.com/upchieve/application/high-line.
1. You'll be redirected to your own new repository. Click "Clone", then copy the "Clone with SSH" link.
1. On your local machine open a console, navigate to a workplace, then use the command: `git clone ` and paste the link you copied from the previous step. The command should look like `git clone git@gitlab.com:upchieve/application/high-line.git`.
1. On your local machine, link the UPchieve repository with command: `git remote add upstream git@gitlab.com:upchieve/application/high-line.git`.
1. As a test, run `git pull upstream main`. The result should look like this:
```
From gitlab.com:upchieve/application/high-line
 * branch            main       -> FETCH_HEAD
```

If the test passes, you've successfully deployed a fork and are tracking the UPchieve repository as upstream.

## Keeping your Repository up-to-date with UPchieve's repository.
Because you are working on a fork, your repository will not be updated with contributions until you explicitly pull them from the UPchieve repository to your repository. To get the latest code from the `main` branch to any branch you are working in, run: `git pull upstream main`.

You should do this once every day or two to avoid large surprises as you work. You need to do this just before creating a Merge Request to avoid merge conflicts.

## Testing
Please ensure any new code is well tested. Before submitting a merge request, please:

1. Add Unit tests to your new code.
1. Add Integration tests for your new code.
1. Run all unit tests in this library with `npm run lint && npm run test`.
1. Run all cypress tests for high-line by starting this project server with default seed data (an easy way to do this is with the [docker-compose method](README.md#docker-compose)), forking and/or cloning the https://gitlab.com/upchieve/high-line project, and in that project, invoking `npm run e2e:headless`. This should result in success. To troubleshoot, you can invoke `npm run e2e`, to run CI tests in your own browser.

## Proposing new Code.
When you are ready to submit new code, you can do this on the GitLab UI in your browser:
1. Commit and push your code to a new branch in your repository.
1. In GitLab, looking at your own repository, you should see a button at the top: "Create merge request". Click that button. The merge into should say: `upchieve/applications/high-line:main`. Write a clear, complete description of the change you are proposing, and submit the merge request.
