import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { loginAs } from '../utils.ts'
import { addNthsMember, createNthsPresident } from '../nths-utils.ts'
import { NTHSChapterHQPage } from '../page-object-models/nths-chapter-hq.js'

async function mockChecklist(page) {
  const item = {
    key: 'president-orientation',
    order: 1,
    title: 'Complete President Orientation',
    description: 'Review requirements and plan your recruitment.',
    resources: [],
    checkable: true,
    skippable: false,
    status: 'incomplete',
  }
  const checklist = {
    sections: [
      {
        id: 1,
        title: 'Set Up Your Chapter',
        order: 1,
        items: [item],
      },
    ],
  }

  await page.route(
    /\/api\/nths-groups\/[^/]+\/checklist(?:\/[^/?]+)?(?:\?.*)?$/,
    async (route) => {
      const request = route.request()
      if (request.method() === 'GET') {
        await route.fulfill({ json: { checklist } })
        return
      }
      if (request.method() === 'PUT') {
        item.status = request.postDataJSON().status
        await route.fulfill({
          json: { itemKey: item.key, status: item.status },
        })
        return
      }
      await route.fallback()
    }
  )
}

test.describe('A president can run their chapter from Chapter HQ', () => {
  const dbClient = getClient()
  let president
  let chapter
  let members
  let hq

  test.beforeEach(async ({ page }) => {
    ;({ president, chapter } = await createNthsPresident(dbClient))
    members = []
    for (let i = 0; i < 2; i++) {
      members.push(await addNthsMember(dbClient, { groupId: chapter.groupId }))
    }

    await mockChecklist(page)
    await loginAs(page, president)

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
      const orientation = hq.checklistCheckbox('Complete President Orientation')
      await expect(orientation).not.toBeChecked()
      await orientation.check()
      await expect(orientation).toBeChecked()
      await page.reload()
      await page
        .getByRole('button', { name: 'Expand Set Up Your Chapter' })
        .click()
      await expect(
        hq.checklistCheckbox('Complete President Orientation')
      ).toBeChecked()
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
      await page.getByTestId('title-choice-Vice President').click()
      await page.getByTestId('title-choice-save').click()
      await expect(hq.memberRow(promoted.id)).toContainText('Vice President')
      await page.reload()
      await expect(hq.memberRow(promoted.id)).toContainText('Vice President')
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
