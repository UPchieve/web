import { test } from '@playwright/test'
import { getClient } from '../db.js'
import { createVolunteer } from '../utils.js'
import { Login } from '../page-object-models/login.js'
import { AvailabilityView } from '../page-object-models/availability-view.js'

test.describe('Save availability', async () => {
  let dbClient
  let volunteerUser

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
    volunteerUser = await createVolunteer(dbClient)
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  test('can save timezone and availability', async ({ page }) => {
    const volunteerLogin = new Login(page)
    const availabilityView = new AvailabilityView(page)
    await volunteerLogin.goto()
    await volunteerLogin.loginWith(volunteerUser)
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
