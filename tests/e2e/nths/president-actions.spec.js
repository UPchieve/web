import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { addNthsMember, createNthsPresident } from '../nths-utils.ts'
import { Login } from '../page-object-models/login.js'
import { NTHSChapterHQPage } from '../page-object-models/nths-chapter-hq.js'

test.describe('A president can run their chapter from Chapter HQ', () => {
  let dbClient
  let president
  let chapter
  let members
  let hq

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
  })

  test.afterAll(async () => {
    await dbClient.release()
  })

  test.beforeEach(async ({ page }) => {
    ;({ president, chapter } = await createNthsPresident(dbClient))
    members = []
    for (let i = 0; i < 2; i++) {
      members.push(await addNthsMember(dbClient, { groupId: chapter.groupId }))
    }

    const login = new Login(page)
    await login.goto()
    await login.loginWith(president)
    await page.waitForURL('**/dashboard')

    hq = new NTHSChapterHQPage(page)
  })

  test('a president can copy the invite link, tick the checklist, rename the chapter, change a role, remove a member and open Leave Team', async ({
    page,
  }) => {
    await test.step('Copy the invite link, from Home', async () => {
      await hq.goHome()
      await expect(hq.inviteLink).toHaveText(/\/join-team\/.+/)
      await hq.copyButton.click()
      await expect(hq.copiedButton).toBeVisible()
    })

    await test.step('Tick a checklist item, from To do', async () => {
      await hq.goto()
      const orientation = hq.checklistCheckbox('ATTENDED ORIENTATION')
      await expect(orientation).not.toBeChecked()
      await orientation.check()
      await expect(orientation).toBeChecked()
      await page.reload()
      await expect(hq.checklistCheckbox('ATTENDED ORIENTATION')).toBeChecked()
    })

    await test.step('Edit the chapter name, from Chapter setup', async () => {
      await hq.goSetup()
      const newName = `Renamed ${Date.now()}`
      await hq.nameInput.fill(newName)
      await hq.nameInput.press('Enter')
      await expect(page.getByText('Saved', { exact: true })).toBeVisible()
      await page.reload()
      await expect(hq.nameInput).toHaveValue(newName)
    })

    await test.step("Change a member's role, from Members", async () => {
      await hq.goMembers()
      const promoted = members[0]
      await hq.openMemberMenu(promoted.id)
      await page.getByTestId(`member-make-admin-${promoted.id}`).click()
      await expect(hq.memberRow(promoted.id)).toContainText('Admin')
      await page.reload()
      await expect(hq.memberRow(promoted.id)).toContainText('Admin')
    })

    await test.step('Remove a member, from Members', async () => {
      const removed = members[1]
      const before = await hq.allMembersCount()
      await hq.openMemberMenu(removed.id)
      await page.getByTestId(`member-remove-${removed.id}`).click()
      await hq.confirmRemoveButton.click()

      await expect(hq.memberRow(removed.id)).toHaveCount(0)
      await expect(hq.rosterError).toHaveCount(0)
      expect(await hq.allMembersCount()).toBe(before - 1)

      await page.reload()
      await expect(hq.memberRow(removed.id)).toHaveCount(0)
    })

    await test.step('Open Leave Team, from Chapter setup', async () => {
      // Runs after the removal so Leave Team has to find the current member
      // in the changed roster.
      await hq.goSetup()
      await hq.leaveTeamButton.click()
      await expect(
        page.getByRole('button', { name: /Remove yourself/ })
      ).toBeVisible()
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(hq.leaveTeamButton).toBeVisible()
    })
  })
})
