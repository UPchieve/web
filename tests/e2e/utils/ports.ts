// The e2e stack's ports
//
// TODO: derive these from subway instead of restating them. Each default mirrors
// a value subway owns — SUBWAY_API_PORT and SUBWAY_POSTGRES_PORT in its
// .env.e2e, and the postgres-e2e service in its docker-compose.yml — and nothing
// checks that the two agree. A drift here surfaces as the suite timing out
// against a port nothing is listening on, which reads like a broken app rather
// than a stale constant.
//
// The E2E_* overrides allow the suite to run in parallel against multiple
// environments.
//
// Copies live outside this file and cannot import it: the vite build reads
// .env.test_e2e locally and .env.test_e2e_ci under CI, .gitlab-ci.yml polls
// http://localhost:3001/healthz, and subway's own .env.e2e and
// docker-compose.yml hold the values this file mirrors.

export const subwayPort = process.env.E2E_SUBWAY_PORT || '3001'
export const highLinePort = process.env.E2E_HIGH_LINE_PORT || '8081'
export const postgresPort = process.env.E2E_POSTGRES_PORT || '5500'
