import { mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import router from '@/router'
import store from '@/store'
import StudentPartnerSignupView from '@/views/SignupView/StudentPartnerSignupView.vue'

describe('StudentPartnerSignupView', () => {
  var DEFAULT_STUDENT_PARTNER = {}

  const getWrapper = () => {
    return mount(StudentPartnerSignupView, {
      global: { plugins: [router, store] },
    })
  }
  beforeEach(() => {
    DEFAULT_STUDENT_PARTNER = {
      collegeSignup: false,
      highSchoolSignup: true,
      key: 'test-partner-org',
      name: 'Test Partner Org',
      schoolSignupRequired: true,
      signupCode: 'TPO1',
      sites: ['Site B', 'Site A', 'Site Z', 'Site G'],
      isSchool: false,
      deactivated: false,
    }
  })

  it('Should display partner sites in the dropdown in alphabetical order', async () => {
    const wrapper = getWrapper()
    wrapper.vm.$data.studentPartner = DEFAULT_STUDENT_PARTNER
    await flushPromises()
    const siteSelect = wrapper.get('[data-testid="site-select"]')
    expect(siteSelect.attributes()['options']).toEqual(
      'Site A,Site B,Site G,Site Z'
    ) // alphabetized
  })
})
