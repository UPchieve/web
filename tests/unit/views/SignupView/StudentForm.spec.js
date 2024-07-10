import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import StudentForm from '@/views/SignupView/StudentForm.vue'
import featureFlagsModule from '@/store/modules/feature-flags'
import NetworkService from '@/services/NetworkService'
import { vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import AuthService from '@/services/AuthService'
import { nextTick } from 'vue'
import flushPromises from 'flush-promises'

describe('StudentForm', () => {
  const INELIGIBLE_RESPONSE = {
    data: {
      isEligible: false,
      isCollegeStudent: false,
    },
  }
  const ELIGIBLE_RESPONSE = {
    data: {
      isEligible: true,
      isCollegeStudent: false,
    },
  }

  beforeEach(() => {
    vi.resetAllMocks()

    NetworkService.checkStudentEligibility = vi
      .fn()
      .mockResolvedValue(ELIGIBLE_RESPONSE)
    AnalyticsService.captureEvent = vi.fn().mockResolvedValue()
    NetworkService.checkIpAddress = vi.fn().mockResolvedValue()
    AuthService.registerStudent = vi.fn().mockResolvedValue()
    NetworkService.checkZipCode = vi.fn().mockResolvedValue({
      data: { isValidZipCode: true },
    })
  })

  const getWrapper = async (
    path = '/sign-up/student/eligibility',
    query = {},
    studentPartner = {}
  ) => {
    const store = createStore({
      modules: {
        featureFlags: {
          ...featureFlagsModule,
          getters: {
            ...featureFlagsModule.getters,
            ccIntroCopy: () => true,
            isBfIntroCopyEnabled: () => true,
            bfIntroCopy: () => true,
            eligibilityEmail: () => true,
          },
        },
      },
    })
    const router = createRouter({
      routes: [{ path }],
      history: createMemoryHistory(),
    })
    const wrapper = mount(StudentForm, {
      global: { plugins: [store, router] },
    })
    router.push({ path, query }).catch(() => {}) // Catch to suppress redundant navigation error in tests.

    wrapper.setData({
      ...wrapper.vm.$data,
      studentPartner,
      partnerKey: query?.partner ?? '',
      useParentGuardianSignUpFlow: 'parent' in query,
    })

    await nextTick()
    return wrapper
  }

  describe('Student partner signup with parent/guardian flow', () => {
    var testStudentPartnerOrg

    beforeEach(() => {
      testStudentPartnerOrg = {
        collegeSignup: false,
        highSchoolSignup: true,
        key: 'stu-partner',
        name: 'StuPartner',
        schoolSignupRequired: true,
        signupCode: 'STU_PARTNER',
        isSchool: false,
        deactivated: false,
      }
      NetworkService.getStudentPartner = vi.fn().mockResolvedValue({
        data: {
          studentPartner: testStudentPartnerOrg,
        },
      })
    })

    it('Should register the student and push to the parent/guardian confirmation step if eligible', async () => {
      const wrapper = await getWrapper(
        '/sign-up/student/eligibility',
        {
          parent: 'true',
          partner: testStudentPartnerOrg.key,
        },
        testStudentPartnerOrg
      )
      expect(wrapper.find('[data-testid="eligibility-title"]').text()).toEqual(
        `Welcome ${testStudentPartnerOrg.name} Parent/Guardian!`
      )

      const eligibility = {
        studentFirstName: 'Test',
        studentLastName: 'Testing',
        studentEmail: 'teststu@testing.com',
        parentGuardianEmail: 'testparent@testing.com',
        zipCode: '12345',
        highSchool: { upchieveId: '123', name: 'Some HS' },
        currentGrade: '8th',
      }
      // Fill in eligibility info and submit form
      wrapper.setData({
        studentPartner: testStudentPartnerOrg,
        partnerKey: testStudentPartnerOrg.key,
        useParentGuardianSignupFlow: true,
        eligibility,
      })
      await wrapper.vm.submitEligibilityForm()
      await nextTick()
      await flushPromises()

      expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
        EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY,
        {
          partnerKey: testStudentPartnerOrg.key,
        }
      )
      expect(NetworkService.checkStudentEligibility).toHaveBeenCalledWith(
        expect.objectContaining({
          email: eligibility.studentEmail,
          schoolId: eligibility.highSchool.upchieveId,
          zipCode: eligibility.zipCode,
        })
      )
      expect(AuthService.registerStudent).toHaveBeenCalledWith(
        expect.objectContaining({
          email: eligibility.studentEmail,
          firstName: eligibility.studentFirstName,
          lastName: eligibility.studentLastName,
          parentGuardianEmail: eligibility.parentGuardianEmail,
          studentPartnerOrgKey: testStudentPartnerOrg.key,
        })
      )
      expect(wrapper.vm.$data.step).toEqual('parentGuardianConfirmation')
      expect(
        wrapper.find('[data-testid="pg-confirmation-message"]').isVisible()
      ).toBeTruthy()
    })

    it('Should push to the ineligible step if the student is ineligible', async () => {
      const wrapper = await getWrapper(
        '/sign-up/student/eligibility',
        {
          parent: true,
          partner: testStudentPartnerOrg.key,
        },
        testStudentPartnerOrg
      )
      // Fill in eligibility info and submit form
      const eligibility = {
        parentGuardianEmail: 'parent@guardian.com',
        studentEmail: 'student@school.com',
        studentFirstName: 'Test',
        studentLastName: 'MacTest',
        studentPartnerOrg: testStudentPartnerOrg.key,
        zipCode: '12345',
        highSchool: { upchieveId: '123', name: 'Some HS' },
        currentGrade: '8th',
      }
      wrapper.setData({
        ...wrapper.vm.$data,
        eligibility,
      })
      NetworkService.checkStudentEligibility = vi
        .fn()
        .mockResolvedValue(INELIGIBLE_RESPONSE)
      await wrapper.vm.submitEligibilityForm()
      await nextTick()
      await flushPromises()

      expect(NetworkService.checkStudentEligibility).toHaveBeenCalled()
      expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
        EVENTS.ELIGIBILITY_INELIGIBLE,
        {
          partnerKey: testStudentPartnerOrg.key,
        }
      )
      expect(wrapper.vm.$data.step).toEqual('ineligible')
      expect(
        wrapper.find('[data-testid="eligibility-appeal-message"]').isVisible()
      ).toBeTruthy()
      expect(AuthService.registerStudent).not.toHaveBeenCalled()
    })

    it('Should render the form fields with the correct text', async () => {
      const wrapper = await getWrapper(
        '/sign-up/student/eligibility',
        {
          parent: true,
          partner: testStudentPartnerOrg.key,
        },
        testStudentPartnerOrg
      )
      expect(
        wrapper.find('[data-testid="student-first-name-label"]').text()
      ).toEqual("What is the student's first name?")
      expect(
        wrapper.find('[data-testid="student-last-name-label"]').text()
      ).toEqual("What is the student's last name?")
      expect(
        wrapper
          .find('[data-testid="student-grade-select"]')
          .attributes('placeholder')
      ).toEqual("Select the student's grade")
      expect(
        wrapper
          .find('[data-testid="student-school-autocomplete"]')
          .attributes('placeholder')
      ).toEqual("Search for the student's school")
      expect(
        wrapper
          .find('[data-testid="student-zipcode-input"]')
          .attributes('placeholder')
      ).toEqual("Enter the student's zip code")
      expect(
        wrapper
          .find('[data-testid="student-email-input"]')
          .attributes('placeholder')
      ).toEqual("Enter the student's email address")
      expect(
        wrapper
          .find('[data-testid="parent-guardian-email-input"]')
          .attributes('placeholder')
      ).toEqual('Enter your email address')
    })

    it("Should only render the student's first and last name fields on the eligibility form for parent/guardian signup", async () => {
      const wrapper = await getWrapper()
      expect(
        wrapper.find('[data-testid="student-first-name-label"]').exists()
      ).toBeFalsy()
      expect(
        wrapper.find('[data-testid="student-last-name-label"]').exists()
      ).toBeFalsy()
    })
  })

  describe('Code.org students', () => {
    var testStudentPartnerOrg = {}

    beforeEach(() => {
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
    })

    it("Should render custom code.org copy when it's a code.org student", async () => {
      const wrapper = await getWrapper(
        '/sign-up/student/eligibility',
        {
          partner: 'code-org',
        },
        testStudentPartnerOrg
      )

      expect(wrapper.find('[data-testid="eligibility-title"]').text()).toEqual(
        'Welcome to UPchieve!'
      )
      expect(
        wrapper.find('[data-testid="code-dot-org-custom-copy"]').isVisible()
      ).toBeTruthy()
    })

    it('Makes the eligibility check for code.org students', async () => {
      const wrapper = await getWrapper(
        '/sign-up/student/eligibility',
        {
          partner: 'code-org',
        },
        testStudentPartnerOrg
      )

      // Fill in eligibility form data
      wrapper.vm.$data.eligibility = {
        currentGrade: '9th',
        highSchool: {
          name: 'HS',
          upchieveId: 'test-hs-123',
        },
        zipCode: '00000',
        studentEmail: 'test@testing.com',
      }
      await wrapper.vm.submitEligibilityForm()
      await nextTick()

      expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
        EVENTS.STUDENT_CLICKED_CHECK_MY_ELIGIBILITY,
        {
          partnerKey: 'code-org',
        }
      )
      expect(NetworkService.checkStudentEligibility).toHaveBeenCalled()
    })
  })
})
