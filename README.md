# UPchieve SPA

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

[Contributing Guide](https://gitlab.com/groups/upchieve/-/wikis/1-Community-Development)

## IMPORTANT: THE BACKEND IS IN A SEPARATE REPOSITORY

This repository is the frontend SPA only. It relies on the API server and worker. To set that up follow [the readme for the backend repo](https://gitlab.com/upchieve/subway).

**Table of Contents**

- [UPchieve SPA(#upchieve-spa)
  - [Local Development](#local-development)
    - [Local Dependencies](#local-dependencies)
    - [Package Manager](#package-manager)
    - [App Dependencies](#app-dependencies)
    - [Run the Local Server](#run-the-local-server)
    - [Quality Checks](#quality-checks)
  - [Production Builds](#production-builds)
    - [Production Server](#production-server)
  - [Component Library](#component-library)
    - [Testing Components](#testing-components)

## Local Development

### Local Dependencies

1. The recommended tool for runtime version management is [`nvm`][nvm]. We currently run on Node v24.15.0.

 ```shell
$ nvm install v24.15.0 && nvm use v24.15.0
 ```

2. Install dependencies.

 ```shell
$ pnpm install
 ```

3. Set local environment variables.

 ```shell
$ cp .env.template .env.local
 ```

### Package Manager
This project uses [pnpm](https://pnpm.io/) instead of npm. Once [installed](https://pnpm.io/installation), use `pnpm install <dependency>` to install dependencies, and `pnpm run <script>` to run scripts.

### App Dependencies

As noted above you will also need the backend running on `localhost` on port `3000`

### Run the Local Server

The local server (which supports hot reloading) can be started using:

```shell
$ pnpm run serve
```

The local server does not support one frontend feature, which is notifying when
the version has changed and prompting a reload. To test that, you need to run the production server,
instructions for which are below.

Once the both the backend and frontend local servers are running, you can open the app at `http://localhost:8080`.

### Quality Checks

The CI server runs checks on code linting and HTML validation.

Lint checking currently runs as a pre-commit hook. To fix most issues you can run `$ pnpm run lint`.

HTML validation can be run using `$ pnpm run html-validate`, although currently there are some unresolved errors that
we are working on correcting. The goal for new development should be to not add any _more_ issues while we fix the current ones.

Tests can be run using `$ pnpm run test`

## Production Builds

A production build of the frontend resources (index.html/js/css/images) can be done by running

```shell
$ pnpm run build
```

which puts the output in the directory `dist/`

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

### Testing Components with Vitest Browser Tests instead

Test components in a real Chromium browser using Vitest Browser Mode:

```shell
pnpm run test:browser
```

Tests live in `tests/browser/` and use `vitest-browser-vue` to render components. The setup file at `tests/browser/setup.ts` loads global styles so components render with production styling. Extract mock data into fixture files for maintainability.

### [Alternative] Testing Components with Storybook

_(I suggest we remove this in the future)_

Story states can be imported into unit tests for a component to check things like applied classes and simple behaviors.

Additionally, we use [Storyshots](https://storybook.js.org/docs/react/workflows/snapshot-testing) to check rendered html for a given component to ensure changes aren't breaking the
rendering.

#### Known issue with visually testing SVG components:

Our unit tests do not incorporate visual testing for SVG components (refer to this [component](src/views/DashboardView/StudentDashboard/SubjectSelection/RecentSubjectCard.vue) and its [unit test](tests/unit/components/RecentSubjectCard.spec.js)). The SVG components get successfully rendered on the application itself but not within unit or snapshot test markups.

So, after extensive research and exhausting nearly all possible options of rendering and testing SVGs, as of August 4 2021, we realized that this has been a prolonged JSDOM/JavaScript [issue](https://github.com/vuejs/vue-test-utils/issues/369) and not something that is occuring due to vue-test-utils or jest capabilities. Hence, consider it acceptable to not visually test SVGs for the time being. Or, use Vitest browser tests with a real browser.

## E2E Testing

### How it works

When you run `pnpm run test:e2e`, the subway and high-line servers are started for you, and subway will use fresh, dockerized postgres and redis instances that are hosted on ports 5500 and 5501 by default. The db is seeded with the scripts in the `/db_init` folder of the subway repo on your machine.

If there was an existing E2E postgres or redis docker container, they will be destroyed before new ones are created.

Note: You don't need to start the backend or frontend servers yourself. Playwright starts up the servers as part of test configuration with the NODE_ENV environment variable set to `test_e2e`. Playwright will fail to startup if you already have either running.

### Local Setup

1. Install chrome for playwright: `npx playwright install chrome`
2. **Set your environment variable `SUBWAY_REPO_PATH` to wherever your subway project is stored on your machine.** This enables the startup script to create the dockerized e2e environment and start the subway server.
3. You will see subway logs only for the log level defined in your subway env variables - check your subway's `.env.e2e` and set `SUBWAY_LOG_LEVEL` to whichever level (i.e. `info, error`) you'd like.
4. Set up a `.env.test_e2e` file for your local E2E test runs. You can pull this from 1Pass.
5. Now run `pnpm run test:e2e` or `pnpm run test:e2e:ui`
   - If running in UI mode, you will want to manually run the "setup subway" project, which will recreate and seed a DB and run subway. To do so, you may have to check it in the Projects dropdown.
   - You need to run this at least once for tests to have a properly seeded database to test against. After the first run, you may choose to deselect it in the Projects to save time.

### CI debugging tips

CI can be a bit harder to debug because, without UI mode, you can't see browser logs or UI replays.

Some things to keep in mind with CI:
- You can adjust the `test:e2e` script in package.json to just run the test(s) you care about
- Take note of how many workers are running in CI vs. local.
- Try to write tests that aren't dependent on each other / share some user state

You can also forward browser logs to the CI job by adding the following in your test file:

```ts
test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`)
  })
})
```

You might also print the inner HTML at whatever point in time in your failing test you need to "see" what is in the DOM. You can open the output into an HTML viewer:

```ts
  const innerHtml = await page.innerHTML('.my-class')
  console.log(innerHtml)
```

Each E2E CI job also outputs log artifacts that you can look at. When the test completes, look for the "Artifacts" button on the right side and download `high-line.log` and `subway.log`.

### Adding test data

You can use the DB client exposed in the `/tests/e2e` folder to add test data to the E2E database.

For now, all test suites work off of the same postgres instance in parallel, and there is no cleanup step in between tests. This means collisions in test data are possible. **To mitigate that risk, please create new users/profiles for each test file that you create.** (@TODO - Cleanup db state between tests)

### Updating snapshots

The E2E tests include several [snapshot tests](https://playwright.dev/docs/test-snapshots), which make pixel-by-pixel comparisons between a pre-saved snapshot file and the state of the screen during test.

Remember to update snapshots as needed with `pnpm run test:e2e:update-snapshots` when applicable.

Sometimes, snapshot tests fail because dynamically generated inputs, such as anything faker-generated, get rendered on screen and are bound to be different from run to run. To exclude those elements from snapshot comparisons, you can use a [toHaveScreenshot mask](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1-option-mask).

Example:

```
Component:

<template>
<p data-e2e-ignore>
  Welcome, {{ firstName }}!
</p>
```
