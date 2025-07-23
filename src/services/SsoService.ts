import config from '@/config'

export enum SsoProvider {
  GOOGLE = 'google',
  CLEVER = 'clever',
  CLASSLINK = 'classlink',
}

export function signInWithSso(paramsData: { [key: string]: unknown }) {
  const params = new URLSearchParams()
  for (const key of Object.keys(paramsData)) {
    if (paramsData[key]) params.append(key, paramsData[key] as string)
  }
  const url = `${config.serverRoot}/auth/sso?${params.toString()}`
  window.location.replace(url)
}
