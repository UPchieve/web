# UPchieve web client

> Online tutoring platform built with Vue.js and Webpack

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

[Contributing Guide](CONTRIBUTING.md)

## GITLAB

NOTE: Active development on this project has moved to https://gitlab.com/upchieve/subway, no more pushes should go straight to the Github repo.

## Build Setup

1. Install NodeJS either via [binary](https://nodejs.org/en/) or [Homebrew](http://brew.sh) (`brew install node`)


2. Run the following command to get the version number of both NPM and Node. Node has to be >= 11.7.0 and NPM has to be >= 6.0.0 for this project.
``` bash
# Get NPM version
npm -v

# Get Node version
node -v
```

> Note: if either of the following errors occur, [add Node and NPM to your $PATH](https://unix.stackexchange.com/questions/26047/how-to-correctly-add-a-path-to-path) and restart the command prompt.
>
> - `'node' is not recognized as an internal or external command, operable program or batch file`
> - `npm' is not recognized as an internal or external command, operable program or batch file`


3. Clone the repository using HTTPS, SSH, or a git client like [Fork](https://git-fork.com/).
``` bash
# HTTPS
git clone https://github.com/UPchieve/web.git

# SSH
git clone git@github.com:UPchieve/web.git
```

4. Move into the repository folder:
``` bash
cd web
```

5. Install Node dependencies:
``` bash
# install dependencies
npm install
```

6. NPM commands (available to use in the web repository directory)
``` bash
# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build and start [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
BUNDLE_ANALYZER=1 npm run build

# run unit tests
npm run test

# run e2e tests
npm run e2e

# run linter
npm run lint

# remove node_modules & dist then reinstall
npm run clean-slate
```

7. See [the web server repo](https://github.com/UPchieve/server) for server installation

More information about our Vue setup:
- [Vue CLI](https://cli.vuejs.org/guide/)
- [Vue style guide](https://vuejs.org/v2/style-guide/)


## Build Setup Docker Alternative

This can also be run with docker and no other software. Use these instructions to rebuild your image as you iterate. It is assumed that you have Docker installed and running.

1. Download the repository.
``` bash
#Clone the repository
git clone https://github.com/UPchieve/web.git
```

2. Move into the repository
``` bash
#Enter the repository
cd web
```

3. The below command will make the program visible at localhost:8080
``` bash
#The first time this is run it may take a few minutes, but afterwards it should be faster. Rerun with each change to see updates
docker build -t upchieve/web . && docker run -it -p 8080:8080 --rm --name upchieve-web-prototype-1 upchieve/web
```
