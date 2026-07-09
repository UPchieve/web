import { ChildProcess, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// playwright runs `global.setup.ts` and `global.teardown.ts` in separate
// workers so we save subway's PID to a file at setup time
// and read it back at teardown time (and in the signal handlers).
const SUBWAY_PID_FILE = join(tmpdir(), 'high-line-e2e-subway.pid')

export function setSubwayProcess(process: ChildProcess | null) {
  if (process?.pid) {
    try {
      writeFileSync(SUBWAY_PID_FILE, String(process.pid), 'utf8')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[SUBWAY] failed to write pid file', err)
    }
  } else {
    clearSubwayPidFile()
  }
}

function readSubwayPidFromFile(): number | null {
  try {
    if (!existsSync(SUBWAY_PID_FILE)) return null
    const pid = Number(readFileSync(SUBWAY_PID_FILE, 'utf8').trim())
    return Number.isInteger(pid) && pid > 0 ? pid : null
  } catch {
    return null
  }
}

function clearSubwayPidFile() {
  try {
    rmSync(SUBWAY_PID_FILE, { force: true })
  } catch {
    // ignore
  }
}

export function killSubwayServer() {
  const rootPid = readSubwayPidFromFile()

  if (!rootPid) {
    // eslint-disable-next-line no-console
    console.error('[SUBWAY] no subway pid found, nothing to kill')
    return
  }

  process.kill(-rootPid, 'SIGTERM')

  // eslint-disable-next-line no-console
  console.error('[SUBWAY] subway process tree killed')
  setSubwayProcess(null)
  clearSubwayPidFile()
}

export function killSubwayEnv() {
  const destroyEnvProcess = spawnSync('pnpm', ['run', 'e2e:destroy'], {
    cwd: process.env.SUBWAY_REPO_PATH,
  })
  if (destroyEnvProcess.error) {
    // eslint-disable-next-line no-console
    console.error(
      `[SUBWAY ENV] killSubwayEnv() errored. PID = ${destroyEnvProcess.pid}`,
      destroyEnvProcess.error
    )
  } else {
    // eslint-disable-next-line no-console
    console.log('[SUBWAY ENV] killed subway env')
  }
}

let hasCleanedUp = false
export function teardownSubway() {
  if (hasCleanedUp) return
  hasCleanedUp = true
  killSubwayServer()
  killSubwayEnv()
}

let signalHandlersRegistered = false
export function registerSubwaySignalHandlers() {
  if (signalHandlersRegistered || process.env.CI) return
  signalHandlersRegistered = true

  const handle = (signal: NodeJS.Signals) => {
    // eslint-disable-next-line no-console
    console.warn(`\n[SUBWAY] received ${signal}, tearing down subway...`)
    teardownSubway()
    // https://nodejs.org/api/process.html
    // 128 + signal number is the conventional exit code for signal termination.
    process.exit(signal === 'SIGINT' ? 128 : 143)
  }

  process.once('SIGINT', handle)
  process.once('SIGTERM', handle)
}
