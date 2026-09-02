import { shallowMount, flushPromises } from '@vue/test-utils'
import SessionHistoryView from '@/views/SessionHistoryView.vue'
import { describe, beforeEach, it, vi } from 'vitest'
import NetworkService from '../../../src/services/NetworkService'
import { createStore } from 'vuex'
import { nextTick } from 'vue'
import subjectsModule from '@/store/modules/subjects'

vi.mock('../../../src/services/NetworkService')

const mockedNetworkService = vi.mocked(NetworkService)

const ROUTE_PATH = '/sessions/history'
const DEFAULT_ROUTE_QUERY = {
  firstName: 'Malzie',
  subjectName: 'prealgebra',
  studentId: 'stu-123',
  volunteerId: 'coach-456',
  hasUnreadDMs: 'false',
}
const MOCK_PUSH = vi.fn()
const MOCK_ROUTER = {
  push: MOCK_PUSH,
}
function getWrapper(overrides = {}) {
  const defaultRoute = {
    path: ROUTE_PATH,
    query: DEFAULT_ROUTE_QUERY,
  }
  return shallowMount(SessionHistoryView, {
    global: {
      plugins: [
        createStore({
          modules: {
            subjects: {
              ...subjectsModule,
            },
            user: {
              namespaced: true,
              getters: {
                isVolunteer: () => true,
                sessionPartner: () => ({
                  firstname: 'Louise',
                }),
              },
            },
          },
        }),
      ],
      mocks: {
        $route: {
          ...defaultRoute,
          ...(overrides.route ?? {}),
        },
        $router: MOCK_ROUTER,
      },
    },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Filtering sessions', () => {
  beforeEach(() => {
    mockedNetworkService.getSessionHistory.mockResolvedValue({
      data: {
        pastSessions: [],
      },
    })
  })

  const testCases = [
    {
      query: DEFAULT_ROUTE_QUERY,
      expectedFilters: { ...DEFAULT_ROUTE_QUERY, hasUnreadDMs: false },
      comment:
        'Correctly converts "false" string in route params to false boolean',
    },
    {
      query: { ...DEFAULT_ROUTE_QUERY, hasUnreadDMs: 'true' },
      expectedFilters: { ...DEFAULT_ROUTE_QUERY, hasUnreadDMs: true },
      comment:
        'Correctly converts "true" string in route params to trueboolean',
    },
    {
      query: {
        firstName: '',
        subjectName: '',
        studentId: '',
        volunteerId: '',
        hasUnreadDMs: '',
      },
      expectedFilters: {
        firstName: '',
        subjectName: '',
        studentId: '',
        volunteerId: '',
        hasUnreadDMs: false,
      },
      comment: 'Correctly converts filters not provided in the query params',
    },
  ]
  it.each(testCases)(
    `Pulls initial filters from the route's query parameters`,
    async (testCase: { query: any; expectedFilters: any; comment: string }) => {
      const mockRoute = {
        path: ROUTE_PATH,
        query: {
          ...testCase.query,
        },
      }
      const wrapper = getWrapper({ route: mockRoute })
      await flushPromises()
      await nextTick()
      await nextTick()
      expect(wrapper.vm.$data.filters, testCase.comment).toEqual(
        testCase.expectedFilters
      )
    }
  )
})
