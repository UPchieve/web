import MessagesView from '@/views/MessagesView.vue'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import type { PastStudent } from '@/types/volunteers'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { createStore } from 'vuex'

const router = vi.hoisted(() => ({
  route: { query: {} as Record<string, unknown> },
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => router.route,
  useRouter: () => ({ push: router.push, replace: router.replace }),
}))

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getPastStudents: vi.fn(),
  },
}))

vi.mock('@/services/LoggerService', () => ({
  default: {
    noticeError: vi.fn(),
  },
}))

const mockedNetworkService = vi.mocked(NetworkService)
const mockedLoggerService = vi.mocked(LoggerService)

function pastStudent(overrides: Partial<PastStudent> = {}): PastStudent {
  return {
    studentId: 'student-1',
    firstName: 'Jordan',
    sessionId: 'session-1',
    subjectName: 'precalculus',
    subjectDisplayName: 'Precalculus',
    createdAt: '2026-09-17T17:45:00',
    timeTutored: 90 * 60 * 1000,
    ...overrides,
  }
}

function mountView() {
  return mount(MessagesView, {
    global: {
      plugins: [
        createStore({
          modules: {
            app: {
              namespaced: true,
              getters: { mobileMode: () => false },
            },
          },
        }),
      ],
      stubs: { Loader: true, DirectMessagePanel: true },
    },
  })
}

function students(count: number): PastStudent[] {
  return Array.from({ length: count }, (_, i) =>
    pastStudent({
      studentId: `student-${i + 1}`,
      firstName: `Student ${i + 1}`,
    })
  )
}

function stepper(wrapper: ReturnType<typeof mountView>, label: string) {
  const button = wrapper
    .findAll('.page-actions__stepper')
    .find((b) => b.text() === label)
  if (!button) throw new Error(`No ${label} button`)
  return button
}

function cardNames(wrapper: ReturnType<typeof mountView>) {
  return wrapper
    .findAll('[data-testid="person-card-name"]')
    .map((name) => name.text())
}

describe('MessagesView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    router.route = reactive({ query: {} })
    router.push.mockImplementation(({ query }) => {
      router.route.query = query
      return Promise.resolve()
    })
    router.replace.mockImplementation(({ query }) => {
      router.route.query = query
      return Promise.resolve()
    })
  })

  it('shows the loader, not the empty state, while students load', () => {
    mockedNetworkService.getPastStudents.mockReturnValue(new Promise(() => {}))
    const wrapper = mountView()

    expect(wrapper.find('.students-loader').exists()).toBe(true)
    expect(wrapper.find('.students__no-students').exists()).toBe(false)
  })

  it("renders a card per student with their last session's details", async () => {
    mockedNetworkService.getPastStudents.mockResolvedValue({
      pastStudents: [
        pastStudent(),
        pastStudent({
          studentId: 'student-2',
          firstName: 'Sam',
          subjectDisplayName: 'Biology',
          createdAt: '2026-07-21T15:15:00',
          timeTutored: 15 * 60 * 1000,
        }),
      ],
    })
    const wrapper = mountView()
    await flushPromises()

    expect(cardNames(wrapper)).toEqual(['Jordan', 'Sam'])
    const firstCardDetails = wrapper
      .findAll('.student-card')[0]
      .findAll('[data-testid="person-card-detail"]')
      .map((detail) => detail.text())
    expect(firstCardDetails).toEqual([
      'Precalculus',
      'Sep 17, 2026',
      '1 hr 30 min',
    ])
  })

  it("opens the student's conversation when Message is clicked", async () => {
    mockedNetworkService.getPastStudents.mockResolvedValue({
      pastStudents: [pastStudent()],
    })
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DirectMessagePanel' }).exists()).toBe(
      false
    )
    const messageButton = wrapper.find('[data-testid="message-button"]')
    expect(messageButton.attributes('aria-label')).toBe('Message Jordan')
    await messageButton.trigger('click')

    const panel = wrapper.findComponent({ name: 'DirectMessagePanel' })
    expect(panel.props()).toEqual({
      partnerId: 'student-1',
      partnerName: 'Jordan',
      partnerType: 'student',
    })

    panel.vm.$emit('close')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'DirectMessagePanel' }).exists()).toBe(
      false
    )
  })

  it('shows the empty state when the volunteer has no past students', async () => {
    mockedNetworkService.getPastStudents.mockResolvedValue({ pastStudents: [] })
    const wrapper = mountView()
    await flushPromises()

    expect(cardNames(wrapper)).toEqual([])
    expect(wrapper.find('.students__no-students').text()).toContain(
      "You haven't had any students yet!"
    )
  })

  it('shows an error and logs it when loading fails', async () => {
    const error = new Error('Network error')
    mockedNetworkService.getPastStudents.mockRejectedValue(error)
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.info').text()).toBe(
      'We were unable to load your students. Please try again later.'
    )
    expect(wrapper.find('.students-loader').exists()).toBe(false)
    expect(mockedLoggerService.noticeError).toHaveBeenCalledWith(error)
  })

  it('shows 5 students per page and steps through pages', async () => {
    mockedNetworkService.getPastStudents.mockResolvedValue({
      pastStudents: students(7),
    })
    const wrapper = mountView()
    await flushPromises()

    expect(cardNames(wrapper)).toEqual([
      'Student 1',
      'Student 2',
      'Student 3',
      'Student 4',
      'Student 5',
    ])
    expect(stepper(wrapper, 'Previous').attributes('disabled')).toBeDefined()
    expect(stepper(wrapper, 'Next').attributes('disabled')).toBeUndefined()

    await stepper(wrapper, 'Next').trigger('click')
    await flushPromises()

    expect(router.push).toHaveBeenCalledWith({ query: { page: 2 } })
    expect(cardNames(wrapper)).toEqual(['Student 6', 'Student 7'])
    expect(wrapper.find('.page-num--active').text()).toBe('2')
    expect(stepper(wrapper, 'Next').attributes('disabled')).toBeDefined()
  })

  it('moves to the last page when the page in the URL is too high', async () => {
    router.route.query = { page: '4' }
    mockedNetworkService.getPastStudents.mockResolvedValue({
      pastStudents: students(7),
    })
    const wrapper = mountView()
    await flushPromises()

    expect(router.replace).toHaveBeenCalledWith({ query: { page: 2 } })
    expect(cardNames(wrapper)).toEqual(['Student 6', 'Student 7'])
  })

  it('hides the pagination when there are no students', async () => {
    mockedNetworkService.getPastStudents.mockResolvedValue({ pastStudents: [] })
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.page-actions').exists()).toBe(false)
  })
})
