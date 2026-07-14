import { test as teardown } from '@playwright/test'
import { spawnSync } from 'node:child_process'

teardown('delete database', async () => {
  if (process.env.CI) {
    // eslint-disable-next-line no-console
    console.warn('CI environment detected, skipping environment teardown.')
    return
  }

  spawnSync('pnpm run e2e:destroy', {
    cwd: process.env.SUBWAY_REPO_PATH,
    stdio: 'pipe',
  })
})
