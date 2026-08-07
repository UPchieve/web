// TODO: Pull from environment variables instead.
// CI and local both start the backend with `e2e:backend`, which serves on the
// port set by SUBWAY_API_PORT in subway's .env.e2e.
const baseUrl = 'http://localhost:3001'

export async function post(route: string, body: Record<string, unknown>) {
  if (!route.startsWith('/')) {
    route = '/' + route
  }

  const response = await fetch(baseUrl + route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': 'hello-world',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('TODO make this error better')
  }

  return response.json()
}
