import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import userModule from '@/store/modules/user'
import PhoneNumberVerificationModal from '@/views/PhoneNumberVerificationModal.vue'
import AuthService from '@/services/AuthService'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('PhoneNumberVerificationModal', () => {
  let DEFAULT_PROPS
  
  beforeEach(() => {
    jest.resetAllMocks()
    DEFAULT_PROPS = {
      phoneNumberToVerify: '+18180000001',
      closeModal: () => {},
    }
  })

  const getWrapper = (user = {}, props = DEFAULT_PROPS) => {
    const store = new Vuex.Store({
      modules: {
        user: {
          ...userModule,
          state: {
            user,
          },
        },
      },
    })
    return shallowMount(PhoneNumberVerificationModal, {
      localVue,
      store,
      propsData: props,
    })
  }

  describe('Verify Phone Number', () => {
    it('Should disable this button while the textbox has an invalid code input', async () => {
      const wrapper = getWrapper()
      const verifyButton = wrapper.find('#verify-phone-btn')
      const codeInput = wrapper.find('#verification-code-field')

      // Disabled while no input
      expect(verifyButton.attributes('disabled')).toBeDefined()

      // Disabled while < 6 digits
      codeInput.setValue('12345')
      await wrapper.vm.$nextTick
      expect(verifyButton.attributes('disabled')).toBeDefined()

      // Enabled when 6 digits
      codeInput.setValue('123456')
      await wrapper.vm.$nextTick
      expect(verifyButton.attributes('disabled')).toBeUndefined()
    })

    it('Should call the AuthService when the verify phone number button is clicked', async () => {
      const wrapper = getWrapper()
      const verifyButton = wrapper.find('#verify-phone-btn')
      expect(verifyButton.isVisible()).toBeTruthy()

      AuthService.confirmVerification = jest.fn().mockResolvedValue(true)

      // Input code to enable button
      const codeInput = wrapper.find('#verification-code-field')
      codeInput.setValue('123456')
      await wrapper.vm.$nextTick
      // Click the button
      verifyButton.trigger('click')
      await wrapper.vm.$nextTick()
      expect(AuthService.confirmVerification).toHaveBeenCalled()
    })
  })

  describe('Resend Code', () => {
    it('Should call the AuthService when the Resend Code button is clicked', async () => {
      AuthService.initiateVerification = jest.fn()
      const wrapper = getWrapper()
      const resendBtn = wrapper.find('#resend-btn')

      // Click it
      resendBtn.trigger('click')
      await wrapper.vm.$nextTick
      expect(AuthService.initiateVerification).toHaveBeenCalled()
    })
  })

  describe('Cancel', () => {
    it('Should close the modal when the Cancel button is clicked', async () => {
      const closeModalFn = jest.fn()
      const wrapper = getWrapper({}, {
        ...DEFAULT_PROPS,
          closeModal: closeModalFn,
      })
      const cancelBtn = wrapper.find('#cancel-btn')

      expect(cancelBtn.isVisible()).toBeTruthy()

      cancelBtn.trigger('click')
      await wrapper.vm.$nextTick

      expect(closeModalFn).toHaveBeenCalled()
    })
  })

  /* When the user is verifying an unsaved phone number,
     * the modal should render extra text. This text should not appear if
     * the user is verifying an existing number.
     */
  describe('New phone number', () => {
    it('Should render extra text when the phone number to verify is a new phone number', async () => {
      const wrapper = getWrapper(
        {
          phone: '+18607778888',
        },
        {
          ...DEFAULT_PROPS,
          phoneNumberToVerify: '+18180000001',
      })
      const numberToVerifyWrapper = wrapper.find('.verification-phone-number')
      expect(numberToVerifyWrapper.exists()).toBeTruthy()
      expect(numberToVerifyWrapper.text()).toContain('+18180000001')

      expect(
        wrapper.find('#phone-number-changed-message').isVisible()
      ).toBeTruthy()
    })

    it('Should NOT render extra text about changing the current number when we are verifying the existing number', async () => {
      const phone = '+18601112222'
      const wrapper = getWrapper(
        {
          phone,
        },
        {
          ...DEFAULT_PROPS,
          phoneNumberToVerify: phone,
        }
      )
      wrapper.setData({
        phoneNumber: phone,
      })
      expect(wrapper.find('#phone-number-changed-message').exists()).toBeFalsy()
    })
  })
})
