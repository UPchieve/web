import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { vi } from 'vitest'
import RemovePhoneConfirmationModal from '@/views/ProfileView/RemovePhoneConfirmationModal.vue'
import NetworkService from '@/services/NetworkService'
import userModule from '@/store/modules/user'
import appModule from '@/store/modules/app/index'
import flushPromises from 'flush-promises'

vi.mock('../../../../src/services/NetworkService')
describe('RemovePhoneConfirmationModal', () => {
  let defaultUserState
  const mockCancel = vi.fn()
  const mockAccept = vi.fn()

  const getWrapper = (mobileMode = false, userType = 'student') => {
    const store = createStore({
      modules: {
        user: {
          ...userModule,
          state: {
            user: {
              ...defaultUserState,
            },
          },
          getters: {
            userType: () => userType,
            isVolunteer: () => userType === 'volunteer',
            isStudent: () => userType === 'student',
          }
        },
        app: {
          ...appModule,
          getters: {
            mobileMode: () => mobileMode,
          },
        },
      },
    })
    return mount(RemovePhoneConfirmationModal, {
      global: { plugins: [store] },
      props: {
        onCancel: mockCancel,
        onAccept: mockAccept,
      },
    })
  }

  beforeEach(() => {
    vi.resetAllMocks()
    defaultUserState = {
      email: 'testUserEmail123@test.com',
      phone: '+18181234567',
      phoneVerified: true,
      smsConsent: true,
      id: '123456',
    }
  })

  it('Should call the NetworkService when the user clicks to confirm action, and calls props.onAccept', async () => {
    NetworkService.deletePhone = vi.fn().mockResolvedValue({ status: 200 })
    const wrapper = getWrapper()
    await wrapper
      .find('[data-testid="remove-phone-accept-btn"]')
      .trigger('click')
    await flushPromises()

    expect(NetworkService.deletePhone).toHaveBeenCalledWith(defaultUserState.id)
    expect(NetworkService.deletePhone).toHaveReturned()
    expect(mockCancel).not.toHaveBeenCalled()
    expect(mockAccept).toHaveBeenCalled()
  })

  it('Should not call the NetworkService if the user clicks to cancel, and calls props.onCancel', async () => {
    const wrapper = getWrapper()
    await wrapper
      .find('[data-testid="remove-phone-cancel-btn"]')
      .trigger('click')
    expect(NetworkService.deletePhone).not.toHaveBeenCalled()
    expect(mockAccept).not.toHaveBeenCalled()
    expect(mockCancel).toHaveBeenCalled()
  })

  it('Should render the error message if it receives one', async () => {
    NetworkService.deletePhone = vi.fn().mockRejectedValue({
      response: {
        data: {
          err: 'Test error message',
        },
      },
    })
    const wrapper = getWrapper()
    await wrapper
      .find('[data-testid="remove-phone-accept-btn"]')
      .trigger('click')
    await flushPromises()

    expect(NetworkService.deletePhone).toHaveBeenCalledWith(defaultUserState.id)
    expect(mockCancel).not.toHaveBeenCalled()
    expect(mockAccept).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="remove-phone-error"]').text()).toEqual(
      'Test error message'
    )
  })

  it.each([
    [
      'volunteer',
      'Without a phone number you will no longer receive text notifications during your availability time.',
    ],
    ['student', 'Your phone number will be removed from your account.'],
  ])(
    'Should render the correct text depending on if the user is a student or volunteer (userType=%s)',
    async (userType, expectedCopy) => {
      const wrapper = getWrapper(false, userType)
      expect(
        wrapper.find('[data-testid="confirmation-message"]').text()
      ).toEqual(expectedCopy)
    }
  )
})
