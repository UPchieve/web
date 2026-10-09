import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import { loginAs } from '../utils.ts'
import {
  createNthsPresident,
  denySchoolAffiliation,
  schoolAffiliationStatusOf,
} from '../nths-utils.ts'
import { NTHSChapterPage } from '../page-object-models/nths-chapter.js'

test.describe('NTHS school approval choice', () => {
  const dbClient = getClient()
  let president
  let chapter
  let chapterPage

  test.beforeEach(async ({ page }) => {
    ;({ president, chapter } = await createNthsPresident(dbClient))

    await loginAs(page, president)

    chapterPage = new NTHSChapterPage(page)
    await chapterPage.goto()
  })

  test('president stays a community chapter', async ({ page }) => {
    await chapterPage.schoolApprovalIsOutstanding()

    await chapterPage.openPathChooser()
    await chapterPage.stayCommunity()

    await chapterPage.schoolApprovalIsSettled()
    expect(await schoolAffiliationStatusOf(dbClient, chapter.groupId)).toBe(
      'OPTED_OUT'
    )

    await page.reload()
    await expect(chapterPage.communityCurrentBadge).toBeVisible()
    await expect(chapterPage.stayCommunityButton).toHaveCount(0)
    await chapterPage.schoolApprovalIsSettled()
  })

  test('president seeks school approval', async () => {
    await chapterPage.schoolApprovalIsOutstanding()

    await chapterPage.openPathChooser()
    await chapterPage.chooseSchoolApproved()

    await chapterPage.schoolApprovalIsSettled()
    expect(await schoolAffiliationStatusOf(dbClient, chapter.groupId)).toBe(
      'PENDING_SCHOOL_AFFILIATION'
    )
  })

  test('denied president switches to a community chapter', async () => {
    await denySchoolAffiliation(dbClient, chapter.groupId)
    await chapterPage.goto()

    await chapterPage.schoolApprovalIsOutstanding()

    await chapterPage.openPathChooserAfterDenial()
    await chapterPage.stayCommunity()

    await chapterPage.schoolApprovalIsSettled()
    expect(await schoolAffiliationStatusOf(dbClient, chapter.groupId)).toBe(
      'OPTED_OUT'
    )
  })

  test('president backs out of the advisor form and stays pending', async ({
    page,
  }) => {
    await chapterPage.schoolApprovalIsOutstanding()

    await chapterPage.openPathChooser()
    await chapterPage.chooseSchoolApproved()
    await chapterPage.cancelAdvisorForm()

    expect(await schoolAffiliationStatusOf(dbClient, chapter.groupId)).toBe(
      'PENDING_SCHOOL_AFFILIATION'
    )
    await expect(chapterPage.schoolApprovedCurrentBadge).toBeVisible()
    await chapterPage.schoolApprovalIsSettled()

    await page.reload()
    await expect(chapterPage.schoolApprovedCurrentBadge).toBeVisible()
    await expect(chapterPage.addAdvisorButton).toBeVisible()
    await expect(chapterPage.switchToCommunityButton).toBeVisible()
    await expect(chapterPage.communityCurrentBadge).toHaveCount(0)
  })
})
