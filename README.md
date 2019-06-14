# UPchieve web client

> Online tutoring platform built with Vue.js and Webpack

[![CircleCI](https://circleci.com/gh/UPchieve/web.svg?style=svg)](https://circleci.com/gh/UPchieve/web)

## Build Setup

1. Install NodeJS either via [binary](https://nodejs.org/en/) or [Homebrew](http://brew.sh) (`brew install node`)


2. Run the following command to get the version number of both NPM and Node. Node has to be >= 11.7.0 and NPM has to be >= 6.0.0 for this project.
``` bash
# Get NPM version
npm -v 

# Get Node version 
node -v
```

If either the following error occurs "'node' is not recognized as an internal or external command, operable program or batch file", or "'npm' is not recognized as an internal or external command, operable program or batch file", add Node and NPM to the PATH and restart the command prompt. 

3. Clone repository using either HTTPS or SSH
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

When inside of the repository folder, the following commands can be run:
``` bash
# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

6. See [the web server repo](https://github.com/UPchieve/server) for server installation

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
