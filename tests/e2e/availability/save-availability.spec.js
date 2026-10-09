import { test } from '@playwright/test'
import { getClient } from '../db.ts'
import { createVolunteer, loginAs } from '../utils.ts'
import { AvailabilityView } from '../page-object-models/availability-view.js'

test.describe('Save availability', async () => {
  let volunteerUser

  test.beforeAll(async () => {
    volunteerUser = await createVolunteer(getClient())
  })

  test('can save timezone and availability', async ({ page }) => {
    const availabilityView = new AvailabilityView(page)
    await loginAs(page, volunteerUser)
    await availabilityView.goto()
    const timezone = 'America/New_York'
    await availabilityView.selectTimezone(timezone)
    await availabilityView.selectTimeSlot('monday', '7a')
    await availabilityView.selectTimeSlot('monday', '5p')
    await availabilityView.selectTimeSlot('tuesday', '8a')
    await availabilityView.saveAvailability(timezone, {
      monday: ['7a', '5p'],
      tuesday: ['8a'],
    })
  })
})
