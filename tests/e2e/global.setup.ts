import { spawnSync } from 'node:child_process'
import { test as setup } from '@playwright/test'

export function getSubwayRepoPath() {
  const subwayRepoPath = process.env.SUBWAY_REPO_PATH
  if (!subwayRepoPath) {
    throw new Error(
      'Please set the env var SUBWAY_REPO_PATH before running the tests'
    )
  }
  return subwayRepoPath
}
setup('create new database', async () => {
  if (process.env.CI) {
    // eslint-disable-next-line no-console
    console.warn('CI environment detected, skipping environment setup.')
    return
  }

  const subwayPath = getSubwayRepoPath()
  createSubwayE2eEnvironment(subwayPath)
})

function createSubwayE2eEnvironment(subwayRepoPath: string) {
  spawnSync('pnpm run e2e:create', {
    cwd: subwayRepoPath,
    stdio: 'pipe',
  })
}
