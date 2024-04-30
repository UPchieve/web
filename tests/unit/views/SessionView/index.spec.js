import Vuex from 'vuex'
import userModule from '@/store/modules/user'
import { vi } from 'vitest'
import { createLocalVue, mount } from '@vue/test-utils'
import SessionView from '@/views/SessionView/index.vue'
import { SESSION_TOOL_TYPES } from '@/consts'
import VueSocketIO from 'vue-socket.io'

describe('SessionView', () => {
  const mockSocket = new VueSocketIO({
    connection: 'socketserver.test',
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: vi.fn(),
  })
  const localVue = createLocalVue()
  localVue.use(Vuex)
  localVue.use(mockSocket)

  const DEFAULT_USER = {
    user: {
      id: 'test-user-id',
      isVolunteer: false,
    },
    isSessionConnectionAlive: false,
  }

  const DEFAULT_SESSION = {
    endedAt: null,
    docEditorVersion: 2,
    toolType: SESSION_TOOL_TYPES.DOCUMENT_EDITOR,
    _id: 'session-1',
    id: 'session-1',
  }

  const getWrapper = (opts = {}, mocks = {}) => {
    const store = new Vuex.Store({
      modules: {
        user: {
          ...userModule,
          state: {
            user: {
              ...DEFAULT_USER,
              ...opts?.user ?? {}
            },
            session: {
              ...DEFAULT_SESSION
            }
          },
          actions: {
            ...userModule.actions,
            sessionDisconnected: mocks.sessionDisconnected ?? vi.fn(),
            sessionConnected: mocks.sessionConnected ?? vi.fn(),
          }
        },
      },
    })

    return mount(SessionView, {
      localVue,
      store,
    })
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('Will call user/sessionConnected on socket reconnect', async () => {
    const mockSessionConnected = vi.fn()
    const wrapper = getWrapper({}, {
      sessionConnected: mockSessionConnected
    })
    wrapper.vm.$socket.emit('reconnect')
    expect(mockSessionConnected).toHaveBeenCalled()
  })

  it('Will call user/sessionDisconnected on socket reconnect_attempt', async () => {
    const mockSessionDisconnected = vi.fn()
    const wrapper = getWrapper({}, {
      sessionDisconnected: mockSessionDisconnected
    })
    wrapper.vm.$socket.emit('reconnect_attempt')
    expect(mockSessionDisconnected).toHaveBeenCalled()
  })
})
