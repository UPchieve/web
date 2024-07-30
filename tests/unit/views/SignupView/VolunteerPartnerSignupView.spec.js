import {mount} from "@vue/test-utils";
import store from "@/store";
import VolunteerPartnerSignupView from "@/views/VolunteerPartnerSignupView.vue";
import { faker } from '@faker-js/faker'
import {nextTick} from "vue";
import flushPromises from "flush-promises";
import { vi } from 'vitest'
import AuthService from '@/services/AuthService'

vi.mock('../../../../services/AnalyticsService')
vi.mock('../../../../services/AuthService')

describe('VolunteerPartnerSignupView', () => {
  const PARTNER = {
    name: 'Vol Partner',
    domain: 'volpartner.org',
    key: 'vol-partner',
  }

  AuthService.checkRegister = vi.fn().mockResolvedValue()
  const getWrapper = () => {
    const wrapper = mount(VolunteerPartnerSignupView, {
      global: { plugins: [store], mocks: {
          $route: {
            params: {
              partnerId: PARTNER.key,
              uid: '123',
            }
          }
        } },
    })
    wrapper.vm.$data.volunteerPartner = PARTNER
    return wrapper
  }

  it('Renders step 2 after step 1 is complete', async () => {
    const wrapper = getWrapper()
    // Fill out step 1: Email and password
    const emailInput = wrapper.find('[data-testid="vp-signup-email"]')
    const passwordInput = wrapper.find('[data-testid="vp-signup-password"]')
    await emailInput.setValue(
      faker.internet.email({
        provider: PARTNER.domain,
    }))
    await passwordInput.setValue(faker.internet.password({ prefix: 'P1' }))
    await wrapper
      .find('[data-testid="vp-signup-step1-continue-btn"]')
      .trigger('click')
    expect(wrapper.find('[data-testid="vp-signup-errors"]').exists()).toBeFalsy()
    await nextTick()

    // Confirm step 2 renders
    expect(wrapper.find('[data-testid="vp-signup-step-2-title"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="vp-signup-first-name"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="vp-signup-last-name"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="vp-signup-user-agreement"]').isVisible()).toBeTruthy()
    expect(wrapper.find('[data-testid="vp-signup-complete-button"]').isVisible()).toBeTruthy()
    expect(wrapper.find('#phoneNumber').isVisible()).toBeTruthy()
  })
})
