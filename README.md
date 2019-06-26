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

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

7. To track errors on Sentry using your own account, set the `SENTRY_DSN` environment variable in one of the local configuration files `config/prod.local.env.js` or `config/dev.local.env.js`. For example:
```
module.exports = {
  SENTRY_DSN: '"__YOUR_PUBLIC_DSN__"'
}
```

8. See [the web server repo](https://github.com/UPchieve/server) for server installation

More information about our Vue setup:
- [Vue style guide](https://vuejs.org/v2/style-guide/)
- [vue-loader](http://vuejs.github.io/vue-loader)
- [Boilerplate Vue template this project used](http://vuejs-templates.github.io/webpack/)

