// TODO: Pull from environment variables instead.
const baseUrl = process.env.CI
  ? 'http://localhost:3000'
  : 'http://localhost:3001'

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
