import { spawn, spawnSync } from 'node:child_process'

let subwayProcess
async function exitSubway() {
  // Kill all pids spawned by subwayProcess
  // https://azimi.me/2014/12/31/kill-child_process-node-js.html
  if (subwayProcess?.pid) {
    process.kill(-subwayProcess.pid)
  }
  destroySubwayE2eEnvironment(getSubwayRepoPath())
  process.exit()
}

;['exit', 'SIGTERM', 'uncaughtException', 'rejectionHandled', 'SIGINT'].forEach(
  (signal) => process.on(signal, exitSubway)
)

export default async function () {
  const subwayPath = getSubwayRepoPath()
  await createSubwayE2eEnvironment(subwayPath)
  // Give time for db to be ready for connections
  // @TODO Wait for a signal or healthcheck instead
  await new Promise((resolve) => setTimeout(resolve, 2 * 1000))

  await startSubway(subwayPath)
}

const getSubwayRepoPath = () => {
  const subwayRepoPath = process.env.SUBWAY_REPO_PATH
  if (!subwayRepoPath) {
    throw new Error(
      'Please set the env var SUBWAY_REPO_PATH before running the tests'
    )
  }
  return subwayRepoPath
}

const createSubwayE2eEnvironment = (subwayRepoPath) => {
  const { error } = spawnSync('npm', ['run', 'e2e:create'], {
    cwd: subwayRepoPath,
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  if (error) {
    throw new Error(
      'Error occurred while creating subway e2e environment',
      error
    )
  }
}

const destroySubwayE2eEnvironment = (subwayRepoPath) => {
  spawnSync('npm', ['run', 'e2e:destroy'], {
    cwd: subwayRepoPath,
    stdio: ['ignore', 'inherit', 'inherit'],
  })
}

const startSubway = async (subwayRepoPath) => {
  let isUp = false
  subwayProcess = await spawn('npm', ['run', 'e2e:backend'], {
    cwd: subwayRepoPath,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: true,
  })
  const waitTimes = [5000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]
  for (const waitTimeMs of waitTimes) {
    await new Promise((r) => setTimeout(r, waitTimeMs))
    try {
      const response = await fetch('http://localhost:3000/healthz')
      if (response.status === 200) {
        isUp = true
        break
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`waited ${waitTimeMs}ms, subway not started yet`)
    }
  }

  if (!isUp) {
    throw new Error(
      `Subway did not start after ${waitTimes.reduce((acc, v) => (acc += v), 0) / 1000} seconds`
    )
  }
  return isUp
}
