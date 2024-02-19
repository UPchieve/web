import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import StudentForm from '@/views/SignupView/StudentForm.vue'
import featureFlagsModule from '@/store/modules/feature-flags'
import NetworkService from '@/services/NetworkService'
import { vi } from 'vitest'
import VueRouter from 'vue-router'
import AnalyticsService from '@/services/AnalyticsService'
import { nextTick } from 'vue'
import {EVENTS} from "@/consts";

describe('StudentForm', () => {
  var localVue

  beforeEach(() => {
    vi.resetAllMocks()
    localVue = createLocalVue()
    localVue.use(Vuex)
    localVue.use(VueRouter)
  })

  const getWrapper = (path = '/sign-up/student/eligibility', query = {}) => {
    const store = new Vuex.Store({
      modules: {
        featureFlags: {
          ...featureFlagsModule,
          getters: {
            ...featureFlagsModule.getters,
            offerGoogleSSO: () => true,
            ccIntroCopy: () => true,
            isBfIntroCopyEnabled: () => true,
            bfIntroCopy: () => true,
            eligibilityEmail: () => true,
          },
        },
      },
    })
    const router = new VueRouter({
      routes: [{ path }],
      mode: 'abstract',
    })
    const wrapper = mount(StudentForm, {
      localVue,
      store,
      router,
    })
    router.push({ path, query }).catch(() => {}) // Catch to suppress redundant navigation error in tests.
    return wrapper
  }

  describe('Code.org students', () => {
    var testStudentPartnerOrg = {}

    beforeEach(() => {
      vi.resetAllMocks()
      testStudentPartnerOrg = {
        collegeSignup: false,
        highSchoolSignup: true,
        key: 'code-org',
        name: 'CDO',
        schoolSignupRequired: true,
        signupCode: 'CDO',
        isSchool: false,
        deactivated: false,
      }
      NetworkService.getStudentPartner = vi.fn().mockResolvedValue({
        data: {
          studentPartner: testStudentPartnerOrg,
        },
      })
      NetworkService.checkStudentEligibility = vi.fn().mockResolvedValue({
        message: '',
        isEligible: true,
        isCollegeStudent: false,
      })
      AnalyticsService.captureEvent = vi.fn().mockResolvedValue()
      NetworkService.checkIpAddress = vi.fn().mockResolvedValue()
      NetworkService.checkZipCode = vi.fn().mockResolvedValue({
        data: { isValidZipCode: true }
      })
    })

    it("Should render custom code.org copy when it's a code.org student", async () => {
      const wrapper = getWrapper('/sign-up/student/eligibility', {
        partner: 'code-org',
      })
      wrapper.vm.$data.studentPartner = testStudentPartnerOrg
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="eligibility-title"]').text()).toEqual(
        'Welcome to UPchieve!'
      )
      expect(
        wrapper.find('[data-testid="code-dot-org-custom-copy"]').isVisible()
      ).toBeTruthy()
    })

    it('Makes the eligibility check for code.org students', async () => {
      const wrapper = getWrapper('/sign-up/student/eligibility', {
        partner: 'code-org',
      })
      wrapper.vm.$data.studentPartner = testStudentPartnerOrg
      wrapper.vm.$data.partnerKey = 'code-org'
      await wrapper.vm.$nextTick()

      // Fill in eligibility form data
      wrapper.vm.$data.eligibility = {
        currentGrade: '9th',
        highSchool: {
          name: 'HS',
          upchieveId: 'test-hs-123',
        },
        zipCode: '00000',
        email: 'test@testing.com',
      }
      await wrapper.vm.submitEligibilityForm()
      await nextTick()

      expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
        EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY, {
          partnerKey: 'code-org'
        }
      )
      expect(NetworkService.checkStudentEligibility).toHaveBeenCalled()
    })
  })
})
