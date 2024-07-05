import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import userModule from '@/store/modules/user'
import { vi } from 'vitest'
import { SESSION_TOOL_TYPES } from '@/consts'
import { merge } from 'lodash-es'
import { socket } from '@/socket'

describe('SessionView', () => {
  const DEFAULT_USER = {
    user: {
      id: 'test-user-id',
      userType: 'student',
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

  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        user: {
          ...userModule,
          state: {
            user: {
              ...DEFAULT_USER,
            },
            session: {
              ...DEFAULT_SESSION,
            },
          },
        },
      },
    })
  )

  beforeEach(() => {
    vi.resetAllMocks()
    // TODO when testing dom changes, make sure to mock this
    // vi.spyOn(NetworkService, 'getIsSubjectValid').mockResolvedValue({
    //   data: { isValid: true },
    // })
    store.dispatch('socket/bindEvents')
  })

  it('Will call user/sessionConnected on socket reconnect and user/sessionDisconnected on reconnect_attempt', async () => {
    expect(store.state.user.isSessionConnectionAlive).toBe(false)
    socket.io.emit('reconnect')
    expect(store.state.user.isSessionConnectionAlive).toBe(true)
    socket.io.emit('reconnect_attempt')
    expect(store.state.user.isSessionConnectionAlive).toBe(false)
  })
})
