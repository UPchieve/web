import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import axios from 'axios'
import router from '@/router'
import { useNthsStore } from '@/stores/nths'
import NetworkService, { axiosInstance } from '@/services/NetworkService'
import store from '@/store'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'

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

const nthsGroupWithRole = (roleName: 'admin' | 'member') => [
  {
    groupInfo: { id: 'nths-group-1' },
    memberInfo: { roleName },
  },
]

beforeEach(() => {
  NetworkService.authStatus = vi.fn().mockResolvedValue({ authenticated: true })
  NetworkService.user = vi.fn().mockResolvedValue({ data: { user: volunteer } })
})

afterEach(() => {
  store.state.featureFlags.toggleFlags[
    POSTHOG_FEATURE_FLAGS.BLOCK_STUDENT_COACH_MODE
  ] = false
  store.state.user.user = { ...volunteer }
})

describe('quiz route alias redirect', () => {
  beforeEach(() => {
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

describe('nthsAdminOnly route guard', () => {
  it('redirects a plain member away from the to-do tab but lets them reach members', async () => {
    useNthsStore().setNTHSGroups(nthsGroupWithRole('member'))

    expect(await visit('/groups/to-do')).toBe('/groups/home')
    expect(await visit('/groups/members')).toBe('/groups/members')
  })

  it('lets an admin reach the to-do tab', async () => {
    useNthsStore().setNTHSGroups(nthsGroupWithRole('admin'))

    expect(await visit('/groups/to-do')).toBe('/groups/to-do')
  })
})

describe('blocked student-volunteer route guard', () => {
  it('redirects blocked users away from volunteer routes', async () => {
    NetworkService.user = vi.fn().mockResolvedValue({
      data: {
        user: {
          ...volunteer,
          isOnboarded: true,
          roleContext: { roles: ['student', 'volunteer'] },
        },
      },
    })
    store.state.user.user.autoFlow = false
    store.state.user.user.isOnboarded = true
    store.state.user.user.roleContext = { roles: ['student', 'volunteer'] }
    store.state.featureFlags.toggleFlags[
      POSTHOG_FEATURE_FLAGS.BLOCK_STUDENT_COACH_MODE
    ] = true

    try {
      expect(await visit('/training')).toBe('/dashboard')
    } finally {
      store.state.featureFlags.toggleFlags[
        POSTHOG_FEATURE_FLAGS.BLOCK_STUDENT_COACH_MODE
      ] = false
      store.state.user.user = { ...volunteer }
    }
  })
})

describe('legacy NTHS tab redirects', () => {
  beforeEach(() => {
    store.state.featureFlags.toggleFlags[
      POSTHOG_FEATURE_FLAGS.BLOCK_STUDENT_COACH_MODE
    ] = false
    // Any NTHS group, of either role, satisfies the parent /groups route
    // guard (nthsRouteGuard('group')) so these redirects can land at all.
    useNthsStore().setNTHSGroups(nthsGroupWithRole('member'))
  })

  it.each([
    { from: '/groups/dashboard', to: '/groups/home' },
    { from: '/groups/manage-team', to: '/groups/members' },
    { from: '/groups/settings', to: '/groups/setup' },
    { from: '/groups/apply-preview', to: '/groups/home' },
  ])('sends $from to $to', async ({ from, to }) => {
    expect(await visit(from)).toBe(to)
  })
})
