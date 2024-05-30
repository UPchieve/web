import { mount } from '@vue/test-utils'
import VerificationMethodSelector from '@/views/VerificationView/VerificationMethodSelector.vue'

describe('VerificationMethodSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const getWrapper = (email = 'testEmail@gmail.com') => {
    return mount(VerificationMethodSelector, {
      props: {
        email,
      },
    })
  }

  it('Should render the phone number input only while the SMS option is selected', async () => {
    const wrapper = getWrapper()
    const emailRadioOption = wrapper.find('[data-testid="email-radio-option"]')
    const smsRadioOption = wrapper.find('[data-testid="sms-radio-option"]')
    const phoneInputSelector = '[data-testid="phone-number-input-container"]'

    // Select Email
    await emailRadioOption.setChecked()
    expect(wrapper.find(phoneInputSelector).exists()).toBeFalsy()

    // Then select SMS
    await smsRadioOption.setChecked()
    expect(wrapper.find(phoneInputSelector).exists()).toBeTruthy()

    // Back to email
    await emailRadioOption.setChecked()
    expect(wrapper.find(phoneInputSelector).exists()).toBeFalsy()
  })
})
