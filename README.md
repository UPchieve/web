# UPchieve SPA

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

[Contributing Guide](CONTRIBUTING.md)

## IMPORTANT: THE FRONTEND IS IN A SEPARATE REPOSITORY
This repository is the frontend SPA only. It relies on the API server and worker. To set that up follow [the readme for the backend repo](https://gitlab.com/upchieve/subway).

**Table of Contents**

- [UPchieve SPA(#upchieve-spa)
  - [Local Development](#local-development)
    - [Local Dependencies](#local-dependencies)
    - [App Dependencies](#app-dependencies)
    - [Run the Dev Server](#run-the-dev-server)
    - [Quality Checks](#quality-checks)
  - [Production Builds](#production-builds)
    - [Production Server](#production-server)
  - [Component Library](#component-library)
    - [Testing Components](#testing-components)

Local Development
-----------------
### Local Dependencies
The recommended tool for runtime version management is [`nvm`][nvm]. To use `nvm` on Windows, first install the appropriate Linux shell distribution using [`WSL`][wsl] (Windows Subsystem for Linux). We currently run on Node v20.10.0, you can switch to this using

```shell
$ nvm install v20.10.0 && nvm use v20.10.0
```

After switching npm versions using nvm, you will need to run `$ npm install`.

### App Dependencies
As noted above you will also need the backend running on `localhost` on ports `3000`, `3001` and `3002`

### Run the Dev Server
The development server (which supports hot reloading) can be started using
```shell
$ npm run serve
```

If your terminal or editor support .env files, there is one in this repo that contains local development values,
otherwise you will need to set them in the environment yourself, as the dev server relies on those environment values.

The development server does not support one frontend feature, which is notifying when
the version has changed and prompting a reload. To test that, you need to run the production server,
instructions for which are below.

Once the both the backend and frontend dev servers are running, you can open the app at `http://localhost:8080`.

### Quality Checks
The CI server runs checks on code linting and HTML validation.

Lint checking currently runs as a pre-commit hook. To fix most issues you can run `$ npm run lint`.

HTML validation can be run using `$ npm run html-validate`, although currently there are some unresolved errors that
we are working on correcting. The goal for new development should be to not add any _more_ issues while we fix the current ones.

Tests can be run using `$ npm run test`


Production Builds
----------------
A production build of the frontend resources (index.html/js/css/images) can be done by running
```
$ npm run build
```
which puts the output in the directory `dist/`

### Production Server
We deploy this application in a container, and the files built above are served by a Node/Express server
which is defined in `server.js`.

This handles security settings and also serves up the version of the app on `/healthz`. To test the feature
where the frontend can recognize that a new version is available and prompt the user to refresh,
1. do a production build
2. set the environment variable `HIGH_LINE_VERSION` to something other than `development`
3. start the server using `$ npm run start`

`$ npm run start` is the command the container uses to start the server in our cloud deployment environments.

## Component Library

We are transitioning to [Storybook](https://storybook.js.org/) to manage our frontend component library, with the goal
of having a cohesive look that is easily expressed by any contributor as we continue to build the site out.

Our Storybook is hosted at the Gitlab pages site for this repository: https://upchieve.gitlab.io/subway/

Each component from `src/components` is imported into a `Component.stories.js` file in `src/stories`. A story
represents one possible rendered state of that component.

Our goal is to have 100% of our components shifted into Storybook, and do refactoring as we go to make them
easier/more logical to use.

Storybook is capable of doing nested component testing all the way up through full view rendering. We'll update
this documentation as we decide how much we want to use storybook beyond atomic components.

All _new_ components should go into Storybook, with stories for each of their states.

### Testing Components

Story states can be imported into unit tests for a component to check things like applied classes and simple behaviors.

Additionally, we use [Storyshots](https://storybook.js.org/docs/react/workflows/snapshot-testing) to check rendered html for a given component to ensure changes aren't breaking the
rendering.

#### Known issue with visually testing SVG components:

Our unit tests do not incorporate visual testing for SVG components (refer to this [component](src/views/DashboardView/StudentDashboard/SubjectSelection/RecentSubjectCard.vue) and its [unit test](tests/unit/components/RecentSubjectCard.spec.js)). The SVG components get successfully rendered on the application itself but not within unit or snapshot test markups.

So, after extensive research and exhausting nearly all possible options of rendering and testing SVGs, as of August 4 2021, we realized that this has been a prolonged JSDOM/JavaScript [issue](https://github.com/vuejs/vue-test-utils/issues/369) and not something that is occuring due to vue-test-utils or jest capabilities. Hence, consider it acceptable to not visually test SVGs for the time being.


## E2E Testing
To run the playwright E2E tests locally, you can use the `npm run test:e2e` or `npm run test:e2e:ui` commands. Make sure you have the front and backend applications running locally before you start the tests.
