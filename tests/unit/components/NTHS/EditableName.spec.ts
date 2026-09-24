import EditableName from '@/components/NTHS/EditableName.vue'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import {
  DOMWrapper,
  enableAutoUnmount,
  flushPromises,
  mount,
} from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

const GROUP_ID = 'group-123'
const SAVED_NAME = 'NTHS at Lincoln High School'

const setNTHSGroupName = vi.fn()

function getWrapper() {
  const store = createStore({
    modules: {
      nths: { namespaced: true, mutations: { setNTHSGroupName } },
    },
  })
  return mount(EditableName, {
    props: { groupId: GROUP_ID, groupName: SAVED_NAME },
    global: { plugins: [store] },
    attachTo: document.body,
  })
}

enableAutoUnmount(afterEach)

describe('EditableName', () => {
  let editGroup: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    editGroup = vi
      .spyOn(NetworkService, 'editNTHSGroup')
      .mockImplementation(async ({ name }) => ({
        data: { group: { name } },
      }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    setNTHSGroupName.mockClear()
  })

  it.each([
    {
      via: 'blur',
      interact: (input: DOMWrapper<Element>) => input.trigger('blur'),
    },
    {
      // The Enter handler calls blur(), which fires a blur event only on a
      // focused element.
      via: 'Enter',
      interact: (input: DOMWrapper<Element>) => {
        input.element.focus()
        return input.trigger('keydown', { key: 'Enter' })
      },
    },
  ])('saves the trimmed name on $via', async ({ interact }) => {
    const wrapper = getWrapper()
    const input = wrapper.find('input')

    await input.setValue('  Bay Area Tutors  ')
    await interact(input)
    await flushPromises()

    expect(editGroup).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      name: 'Bay Area Tutors',
    })
    expect(setNTHSGroupName).toHaveBeenCalledWith(expect.anything(), {
      groupId: GROUP_ID,
      groupName: 'Bay Area Tutors',
    })
    expect(wrapper.find('[data-testid="name-feedback"]').text()).toBe('Saved')
  })

  it('makes no request when the name is unchanged', async () => {
    const wrapper = getWrapper()

    await wrapper.find('input').trigger('blur')
    await flushPromises()

    expect(editGroup).not.toHaveBeenCalled()
  })

  it('puts the saved name back on Escape', async () => {
    const wrapper = getWrapper()
    const input = wrapper.find('input')

    await input.setValue('Something else')
    await input.trigger('keydown', { key: 'Escape' })

    expect(input.element.value).toBe(SAVED_NAME)
  })

  it('refuses a blank name and restores the saved one', async () => {
    const wrapper = getWrapper()
    const input = wrapper.find('input')

    await input.setValue('   ')
    await input.trigger('blur')
    await flushPromises()

    expect(editGroup).not.toHaveBeenCalled()
    expect(input.element.value).toBe(SAVED_NAME)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(
      wrapper.find(`#${input.attributes('aria-describedby')}`).exists()
    ).toBe(true)
  })

  it.each([
    {
      name: 'a plain client-side error',
      rejection: new Error('boom'),
      shown: 'Unknown error, please try again',
      loggedWith: new Error('boom'),
    },
    {
      name: 'raw server text',
      rejection: {
        response: {
          status: 500,
          data: { err: 'Database update error: null value in column "name"' },
        },
      },
      shown: 'Unknown error, please try again',
      loggedWith: 'Database update error: null value in column "name"',
    },
    {
      name: 'a response with no err field',
      rejection: {
        response: {
          status: 502,
          data: '<html><body>502 Bad Gateway</body></html>',
        },
      },
      shown: 'Unknown error, please try again',
      loggedWith: {
        response: {
          status: 502,
          data: '<html><body>502 Bad Gateway</body></html>',
        },
      },
    },
    {
      name: 'the unique-name error',
      rejection: {
        response: { status: 422, data: { err: 'Team name must be unique' } },
      },
      shown: 'Team name must be unique',
      loggedWith: undefined,
    },
  ])(
    'keeps the typed name and shows the right message for $name',
    async ({ rejection, shown, loggedWith }) => {
      editGroup.mockRejectedValue(rejection)
      const noticeError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => {})
      const wrapper = getWrapper()
      const input = wrapper.find('input')

      await input.setValue('Bay Area Tutors')
      await input.trigger('blur')
      await flushPromises()

      expect(input.element.value).toBe('Bay Area Tutors')
      expect(wrapper.text()).toContain(shown)
      if (loggedWith === undefined) {
        expect(noticeError).not.toHaveBeenCalled()
      } else {
        expect(noticeError).toHaveBeenCalledTimes(1)
        expect(noticeError).toHaveBeenCalledWith(loggedWith)
      }
    }
  )

  it('re-sends a rejected name once it changes', async () => {
    editGroup.mockRejectedValueOnce({
      response: { status: 422, data: { err: 'Team name must be unique' } },
    })
    const wrapper = getWrapper()
    const input = wrapper.find('input')

    await input.setValue('Bay Area Tutors')
    await input.trigger('blur')
    await flushPromises()
    expect(editGroup).toHaveBeenCalledTimes(1)

    await input.trigger('blur')
    await flushPromises()
    expect(editGroup).toHaveBeenCalledTimes(1)

    await input.setValue('Bay Area Tutoring Club')
    await input.trigger('blur')
    await flushPromises()

    expect(editGroup).toHaveBeenCalledTimes(2)
    expect(editGroup).toHaveBeenLastCalledWith({
      groupId: GROUP_ID,
      name: 'Bay Area Tutoring Club',
    })
  })

  it('keeps the typed name and its save while a save is in flight', async () => {
    let resolveSave: (value: { data: { group: { name: string } } }) => void
    editGroup.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      })
    )
    const wrapper = getWrapper()
    const input = wrapper.find('input')

    await input.setValue('Bay Area Tutors')
    await input.trigger('blur')
    await input.trigger('blur')
    await input.trigger('keydown', { key: 'Escape' })

    expect(input.element.value).toBe('Bay Area Tutors')
    expect(editGroup).toHaveBeenCalledTimes(1)

    resolveSave!({ data: { group: { name: 'Bay Area Tutors' } } })
    await flushPromises()

    expect(input.element.value).toBe('Bay Area Tutors')
    expect(wrapper.find('[data-testid="name-feedback"]').text()).toBe('Saved')
  })
})
