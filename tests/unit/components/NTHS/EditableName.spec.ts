import EditableName from '@/components/NTHS/EditableName.vue'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNthsStore } from '@/stores/nths'

const GROUP_ID = 'group-123'
const SAVED_NAME = 'NTHS at Lincoln High School'

const FEEDBACK = '[data-testid="name-feedback"]'
const SAVE_BUTTON = '[data-testid="save-name-button"]'
const LENGTH = '[data-testid="name-length"]'
const INPUT = '[data-testid="name-input"]'
const FORM = '[data-testid="name-form"]'

const setNTHSGroupName = vi.fn()

function getWrapper() {
  vi.spyOn(useNthsStore(), 'setNTHSGroupName').mockImplementation(
    setNTHSGroupName
  )
  return mount(EditableName, {
    props: { groupId: GROUP_ID, groupName: SAVED_NAME },
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
    setNTHSGroupName.mockClear()
  })

  it('saves the trimmed name from Save name and confirms it', async () => {
    vi.useFakeTimers()
    const wrapper = getWrapper()

    await wrapper.find(INPUT).setValue('  Bay Area Tutors  ')
    await wrapper.find(SAVE_BUTTON).trigger('click')
    await flushPromises()

    expect(editGroup).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      name: 'Bay Area Tutors',
    })
    expect(setNTHSGroupName).toHaveBeenCalledWith({
      groupId: GROUP_ID,
      groupName: 'Bay Area Tutors',
    })
    expect(wrapper.find(FEEDBACK).text()).toBe('Chapter name updated.')

    vi.advanceTimersByTime(3000)
    await nextTick()
    expect(wrapper.find(FEEDBACK).text()).toBe('')
    vi.useRealTimers()
  })

  it('does not save a changed name on blur', async () => {
    const wrapper = getWrapper()

    await wrapper.find(INPUT).setValue('Bay Area Tutors')
    await wrapper.find(INPUT).trigger('blur')
    await flushPromises()

    expect(editGroup).not.toHaveBeenCalled()
    expect(wrapper.find(SAVE_BUTTON).attributes('disabled')).toBeUndefined()
  })

  it('caps the name at 64 characters', () => {
    const wrapper = getWrapper()

    expect(wrapper.find(INPUT).attributes('maxlength')).toBe('64')
  })

  it('shows the length only from 10 characters short of the cap', async () => {
    const wrapper = getWrapper()
    const input = wrapper.find(INPUT)

    await input.setValue('a'.repeat(53))
    expect(wrapper.find(LENGTH).exists()).toBe(false)

    await input.setValue('a'.repeat(54))
    expect(wrapper.find(LENGTH).text()).toBe('54/64 characters')
  })

  it.each([
    ['unchanged', SAVED_NAME],
    ['unchanged apart from spaces', `  ${SAVED_NAME} `],
    ['blank', '   '],
  ])(
    'disables Save name and sends nothing when the name is %s',
    async (_, value) => {
      const wrapper = getWrapper()
      const button = wrapper.find(SAVE_BUTTON)

      await wrapper.find(INPUT).setValue(value)
      await wrapper.find(FORM).trigger('submit')

      expect(button.attributes('disabled')).toBeDefined()
      expect(editGroup).not.toHaveBeenCalled()
    }
  )

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
      const input = wrapper.find(INPUT)

      await input.setValue('Bay Area Tutors')
      await wrapper.find(FORM).trigger('submit')
      await flushPromises()

      expect(input.element.value).toBe('Bay Area Tutors')
      expect(wrapper.text()).toContain(shown)
      expect(wrapper.find(SAVE_BUTTON).attributes('disabled')).toBeUndefined()
      if (loggedWith === undefined) {
        expect(noticeError).not.toHaveBeenCalled()
      } else {
        expect(noticeError).toHaveBeenCalledTimes(1)
        expect(noticeError).toHaveBeenCalledWith(loggedWith)
      }
    }
  )
})
