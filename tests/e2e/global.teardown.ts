import { test as teardown } from '@playwright/test'
import { teardownSubway } from './teardown-functions'

teardown('delete database', async () => {
  if (process.env.CI) {
    // eslint-disable-next-line no-console
    console.warn('CI environment detected, skipping environment teardown.')
    return
  }

  teardownSubway()
})
