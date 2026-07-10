import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import router from '@/router'
import NetworkService from '@/services/NetworkService'

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
