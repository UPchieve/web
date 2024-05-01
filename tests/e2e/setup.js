import { spawn, spawnSync } from 'node:child_process'

export default async function () {
  const subwayPath = getSubwayRepoPath()
  await createSubwayE2eEnvironment(subwayPath)
  // Give time for db to be ready for connections
  // @TODO Wait for a signal or healthcheck instead
  await new Promise((resolve) => setTimeout(resolve, 2 * 1000))
  startSubway(subwayPath)
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

const createSubwayE2eEnvironment = async (subwayRepoPath, log = false) => {
  const { error } = await spawnSync('npm', ['run', 'e2e:create'], {
    cwd: subwayRepoPath,
    stdio: log ? 'inherit' : 'ignore',
  })
  if (error) {
    throw new Error(
      'Error occurred while creating subway e2e environment',
      error
    )
  }
}

const startSubway = async (subwayRepoPath, log = false) => {
  spawn('npm', ['run', 'e2e:backend'], {
    cwd: subwayRepoPath,
    stdio: log ? 'inherit' : 'ignore',
  })
}
