import { spawn, spawnSync } from 'node:child_process'
import { test as setup } from '@playwright/test'
import {
  setSubwayProcess,
  registerSubwaySignalHandlers,
} from './teardown-functions'

setup('create new database', async () => {
  if (process.env.CI) {
    // eslint-disable-next-line no-console
    console.warn('CI environment detected, skipping environment setup.')
    return
  }

  registerSubwaySignalHandlers()

  const subwayPath = getSubwayRepoPath()
  createSubwayE2eEnvironment(subwayPath)
  // NOTE: This setup expects subway's .env.e2e to have:
  //   SUBWAY_API_PORT=3001
  //   SUBWAY_SOCKETS_PORT=3001
  // This avoids port conflicts with the dev subway instance (which runs on port 3000).
  await startSubway(subwayPath)
})

function getSubwayRepoPath() {
  const subwayRepoPath = process.env.SUBWAY_REPO_PATH
  if (!subwayRepoPath) {
    throw new Error(
      'Please set the env var SUBWAY_REPO_PATH before running the tests'
    )
  }
  return subwayRepoPath
}

function createSubwayE2eEnvironment(subwayRepoPath: string) {
  const { error } = spawnSync('pnpm', ['run', 'e2e:create'], {
    cwd: subwayRepoPath,
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (error) {
    throw new Error(
      `Error occurred while creating subway e2e environment: ${error}`
    )
  }
}

async function startSubway(subwayRepoPath: string) {
  // eslint-disable-next-line no-console
  console.log('[SUBWAY] subway is starting...')
  let isUp = false
  const subwayProcess = spawn('pnpm', ['run', 'e2e:backend'], {
    cwd: subwayRepoPath,
    detached: true,
  })
  setSubwayProcess(subwayProcess)

  subwayProcess.stdout.on('data', (data) => {
    // eslint-disable-next-line no-console
    console.log('[SUBWAY]', data.toString())
  })

  const waitTimes = [5000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  const waitTimeIds: NodeJS.Timeout[] = []
  for (const waitTimeMs of waitTimes) {
    await new Promise((r) => waitTimeIds.push(setTimeout(r, waitTimeMs)))
    try {
      const response = await fetch('http://localhost:3001/healthz')
      if (response.status === 200) {
        isUp = true
        waitTimeIds.forEach(clearTimeout)
        // eslint-disable-next-line no-console
        console.log('[SUBWAY] subway has started!')
        break
      }
    } catch {
      // eslint-disable-next-line no-console
      console.log(`[SUBWAY] waited ${waitTimeMs}ms, subway not started yet`)
    }
  }

  if (!isUp) {
    throw new Error(
      `[SUBWAY] subway did not start after ${waitTimes.reduce((acc, v) => acc + v, 0) / 1000} seconds`
    )
  }
}
