import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'
import router from '@/router'
import NetworkService, { axiosInstance } from '@/services/NetworkService'

const subjects = {
  apChemistry: {
    name: 'apChemistry',
    displayName: 'AP Chemistry',
    unlockQuizName: 'chemistry',
  },
  chemistry: {
    name: 'chemistry',
    displayName: 'Chemistry',
    unlockQuizName: null,
  },
  prealgebra: {
    name: 'prealgebra',
    displayName: 'Prealgebra',
    unlockQuizName: null,
  },
}
const volunteer = {
  id: 'test-vol',
  verified: true,
  userType: 'volunteer',
  certifications: {},
}

const visit = async (path: string) => {
  await router.push(path)
  await flushPromises()
  return router.currentRoute.value.path
}

describe('quiz route alias redirect', () => {
  beforeEach(() => {
    NetworkService.authStatus = vi
      .fn()
      .mockResolvedValue({ data: { authenticated: true } })
    NetworkService.user = vi
      .fn()
      .mockResolvedValue({ data: { user: volunteer } })
    NetworkService.getSubjects = vi
      .fn()
      .mockResolvedValue({ data: { subjects } })
    NetworkService.getQuestions = vi
      .fn()
      .mockResolvedValue({ data: { questions: [{ _id: 'q1' }] } })
  })

  it('reroutes a locked alias to the quiz it reuses', async () => {
    expect(await visit('/training/ap-chemistry/quiz')).toBe(
      '/training/chemistry/quiz'
    )
  })

  it('leaves a non-alias subject alone', async () => {
    expect(await visit('/training/prealgebra/quiz')).toBe(
      '/training/prealgebra/quiz'
    )
  })

  it('does not reroute the reused quiz itself (no redirect loop)', async () => {
    expect(await visit('/training/chemistry/quiz')).toBe(
      '/training/chemistry/quiz'
    )
  })
})

describe('response interceptor', () => {
  it('rejects with the original error when the request was canceled', async () => {
    const controller = new AbortController()
    const request = axiosInstance.get('/api/user', {
      signal: controller.signal,
    })
    // An already-aborted signal rejects on the synchronous request path, before the
    // response interceptors run, so the abort has to land after the request is sent.
    controller.abort()

    await expect(request).rejects.toMatchObject({
      isAxiosError: true,
      code: 'ERR_CANCELED',
    })
  })

  it('rejects with the original error when no response arrives', async () => {
    // Chromium refuses port 1 outright (WHATWG bad-port list), so this fails without
    // depending on what is listening.
    const request = axiosInstance.get('http://127.0.0.1:1/api/user')

    await expect(request).rejects.toMatchObject({
      isAxiosError: true,
      code: 'ERR_NETWORK',
    })
  })

  it('rejects with the original error when the failure precedes the request', async () => {
    const thrown = new axios.AxiosError(
      'request interceptor failed',
      'ERR_TEST'
    )
    const interceptor = axiosInstance.interceptors.request.use(() => {
      throw thrown
    })

    try {
      await expect(axiosInstance.get('/api/user')).rejects.toBe(thrown)
    } finally {
      axiosInstance.interceptors.request.eject(interceptor)
    }
  })

  it('rejects with the original error when a response is present', async () => {
    // The test server answers every path with the SPA shell, so rejecting every status
    // is the only way to drive a response-bearing error through the handler body.
    const request = axiosInstance.get('/api/user', {
      validateStatus: () => false,
    })

    await expect(request).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 200 },
    })
  })
})
