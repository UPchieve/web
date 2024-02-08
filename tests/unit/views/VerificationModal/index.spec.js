import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import userModule from '@/store/modules/user'
import VerificationModal from '@/views/VerificationModal.vue'
import AuthService from '@/services/AuthService'
import { VERIFICATION_METHOD } from '@/consts'
import { vi } from 'vitest';

const localVue = createLocalVue()
localVue.use(Vuex)

describe('VerificationModal', () => {
  let DEFAULT_PROPS

  beforeEach(() => {
    vi.resetAllMocks()
    DEFAULT_PROPS = {
      phoneOrEmailToVerify: '+18180000001',
      verificationMethod: VERIFICATION_METHOD.SMS,
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
    return shallowMount(VerificationModal, {
      localVue,
      store,
      propsData: props,
    })
  }

  describe('Verify Phone Number', () => {
    it('Should disable this button while the textbox has an invalid code input', async () => {
      const wrapper = getWrapper()
      const verifyButton = wrapper.find('[data-testid="verify-code-btn"]')
      const codeInput = wrapper.find('#verification-code-field')

      // Disabled while no input
      expect(verifyButton.attributes('disabled')).toBeDefined()

      // Disabled while < 6 digits
      codeInput.setValue('12345')
      await wrapper.vm.$nextTick()
      expect(verifyButton.attributes('disabled')).toBeDefined()

      // Enabled when 6 digits
      codeInput.setValue('123456')
      await wrapper.vm.$nextTick()
      expect(verifyButton.attributes('disabled')).toBeUndefined()
    })

    it('Should call the AuthService when the verify phone number button is clicked', async () => {
      const wrapper = getWrapper()
      const verifyButton = wrapper.find('[data-testid="verify-code-btn"]')
      expect(verifyButton.isVisible()).toBeTruthy()

      AuthService.confirmVerification = vi.fn().mockResolvedValue(true)

      // Input code to enable button
      const codeInput = wrapper.find('#verification-code-field')
      codeInput.setValue('123456')
      await wrapper.vm.$nextTick()
      // Click the button
      verifyButton.trigger('click')
      await wrapper.vm.$nextTick()
      expect(AuthService.confirmVerification).toHaveBeenCalled()
      await wrapper.vm.$nextTick()
    })
  })

  describe('Resend Code', () => {
    it('Should call the AuthService when the Resend Code button is clicked', async () => {
      AuthService.initiateVerification = vi.fn()
      const wrapper = getWrapper()
      const resendBtn = wrapper.find('#resend-btn')

      // Click it
      resendBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(AuthService.initiateVerification).toHaveBeenCalled()
    })
  })

  describe('Cancel', () => {
    it('Should close the modal when the Cancel button is clicked', async () => {
      const closeModalFn = vi.fn()
      const wrapper = getWrapper(
        {},
        {
          ...DEFAULT_PROPS,
          closeModal: closeModalFn,
        }
      )
      const cancelBtn = wrapper.find('#cancel-btn')

      expect(cancelBtn.isVisible()).toBeTruthy()

      cancelBtn.trigger('click')
      await wrapper.vm.$nextTick()

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
          phoneOrEmailToVerify: '+18180000001',
        }
      )
      const numberToVerifyWrapper = wrapper.find('.verification-destination')
      expect(numberToVerifyWrapper.exists()).toBeTruthy()
      expect(numberToVerifyWrapper.text()).toContain('+18180000001')

      expect(
        wrapper
          .find('[data-testid="phone-or-email-changed-message"]')
          .isVisible()
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
          phoneOrEmailToVerify: phone,
        }
      )
      wrapper.setData({
        phoneOrEmail: phone,
      })
      await wrapper.vm.$nextTick()
      expect(
        wrapper.find('[data-testid="phone-or-email-changed-message"]').exists()
      ).toBeFalsy()
    })

    it.each([
      [
        {
          phoneOrEmailToVerify: 'myTestEmail@gmail.com',
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        },
        {
          sendTo: 'myTestEmail@gmail.com',
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        },
        'email',
      ],
      [
        {
          phoneOrEmailToVerify: '+18607776654',
          verificationMethod: VERIFICATION_METHOD.SMS,
        },
        { sendTo: '+18607776654', verificationMethod: VERIFICATION_METHOD.SMS },
        'phone number',
      ],
    ])(
      'Should render the correct text based on the verification method and supply the correct API request payload',
      async (props, expectedPartialReq, renderedText) => {
        AuthService.initiateVerification = vi.fn()
        const wrapper = getWrapper(
          {
            email: 'myTestEmail@gmail.com',
            phone: '+18607776654',
          },
          { ...DEFAULT_PROPS, ...props }
        )
        // Renders:
        expect(
          wrapper.find('[data-testid="verify-code-btn"]').text()
        ).toContain(renderedText)
        expect(wrapper.find('.verification-destination').text()).toContain(
          props.phoneOrEmailToVerify
        )

        // Sends:
        expect(AuthService.initiateVerification).toHaveBeenCalledWith(
          expect.objectContaining(expectedPartialReq)
        )
      }
    )
  })
})
