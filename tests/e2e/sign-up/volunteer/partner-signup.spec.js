import { test } from '@playwright/test'
import {VolunteerPartnerSignup} from "../../page-object-models/volunteer-partner-signup";
import { faker } from '@faker-js/faker'
import {createPassword} from "../../utils";
test.describe('Volunteer partner signup', async () => {
  const PARTNER = {
    key: 'big-telecom',
    name: 'Big Telecom',
    domain: 'mailtrap.com',
  }

  test('Can sign up as part of a volunteer partner organization', async ({ page }) => {
    await page.goto(`/signup/volunteer/${PARTNER.key}`)
    const volunteerPartnerSignup = new VolunteerPartnerSignup(page)
    await volunteerPartnerSignup.step1IsReady(PARTNER.name)

    const email = faker.internet.email({
      provider: PARTNER.domain
    })
    const password = createPassword()
    await volunteerPartnerSignup.completeStep1(email, password)
    await volunteerPartnerSignup.step2IsReady()
    await volunteerPartnerSignup.completeStep2()
  })
})
