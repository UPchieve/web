import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { getClient } from '../../db.ts'
import { createPassword } from '../../utils'
import { VolunteerSignUp } from '../../page-object-models/volunteer-sign-up.js'

const PARTNER = {
  key: 'big-telecom',
  name: 'Big Telecom',
  requiredEmailDomain: 'mailtrap.com',
}

test.describe('Volunteer partner sign-up', () => {
  const dbClient = getClient()

  test('signs up from a partner link as a volunteer of that partner', async ({
    page,
  }) => {
    const email = faker.internet
      .email({ provider: PARTNER.requiredEmailDomain })
      .toLowerCase()
    const volunteerSignUp = new VolunteerSignUp(page)

    await volunteerSignUp.gotoPartnerLink(PARTNER.key)
    await volunteerSignUp.accountStepIsReadyFor(PARTNER.name)
    await volunteerSignUp.completeAccountStep(email, createPassword())
    await volunteerSignUp.completeAboutStep()

    const { rows } = await dbClient.query(
      `SELECT volunteer_partner_orgs.key
       FROM users
       JOIN volunteer_profiles ON volunteer_profiles.user_id = users.id
       LEFT JOIN volunteer_partner_orgs
         ON volunteer_partner_orgs.id = volunteer_profiles.volunteer_partner_org_id
       WHERE users.email = $1`,
      [email]
    )
    expect(rows).toEqual([{ key: PARTNER.key }])
  })
})
