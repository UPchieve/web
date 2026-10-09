import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import {
  createStudent,
  endSessionsFor,
  loginStudent,
  requestSession,
} from '../utils'

// The layout switcher is MathLive's own markup, so these are its class names
// rather than our test ids.
const KEYBOARD = '.ML__keyboard'
const TOOLBAR = '.MLK__layer.is-visible .MLK__toolbar'

/**
 * Assert the given layout tab can actually be clicked.
 *
 * Hit testing rather than toBeVisible(): when the keyboard overflows its
 * container the tab keeps a bounding box and stays "visible" to Playwright,
 * while on screen it is clipped away and the composer above it swallows the
 * click.
 */
async function expectLayoutTabIsClickable(page, tabLabel) {
  // Retries: switching layouts resizes the keyboard asynchronously, so a single
  // measurement can read the previous layout's geometry.
  await expect(async () => {
    const hit = await page.evaluate(
      ([toolbarSelector, label]) => {
        const toolbar = document.querySelector(toolbarSelector)
        const tab = [...toolbar.querySelectorAll('.left > div')].find(
          (div) => div.textContent.trim() === label
        )
        if (!tab) return { reachable: false, blockedBy: 'tab not rendered' }
        const box = tab.getBoundingClientRect()
        // Whatever is painted on top at the center of the tab: the tab itself
        // when it is reachable, or whichever element is covering it when not.
        const topmost = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2
        )
        return {
          reachable: !!topmost && tab.contains(topmost),
          blockedBy: topmost ? topmost.tagName.toLowerCase() : 'nothing',
        }
      },
      [TOOLBAR, tabLabel]
    )

    expect(
      hit.reachable,
      `the "${tabLabel}" layout tab is not clickable, blocked by ${hit.blockedBy}`
    ).toBe(true)
  }).toPass({ timeout: 5000 })
}

const dbClient = getClient()
test.describe('Session math keyboard', async () => {
  let studentUser

  test.beforeAll(async () => {
    studentUser = await createStudent(dbClient)
  })

  test.afterAll(async () => {
    await endSessionsFor(dbClient, studentUser.id)
  })

  test('can switch back from the abc layout', async ({ browser }) => {
    const { studentPage, studentDashboard } = await loginStudent(
      browser,
      studentUser,
      // SessionView opens the notifications modal once its session context
      // loads, which can land mid-test and close the keyboard. A granted
      // permission keeps it from opening.
      { permissions: ['notifications'] }
    )
    await requestSession(studentDashboard, {
      topic: 'prealgebra',
      subject: 'math',
    })

    await studentPage.getByTitle('Insert math').click()
    await expect(studentPage.locator(KEYBOARD)).toBeVisible()

    const switcher = studentPage.locator(`${TOOLBAR} .left`)
    await expectLayoutTabIsClickable(studentPage, 'abc')

    // The alphabetic layout is a row taller than the other three, so it is the
    // one that used to overflow its container and clip the switcher away.
    await switcher.getByText('abc', { exact: true }).click({ timeout: 10000 })

    // The bug: from abc there was no way back, because the switcher was pushed
    // out of the keyboard and behind the composer.
    await expectLayoutTabIsClickable(studentPage, '123')
    await switcher.getByText('123', { exact: true }).click({ timeout: 10000 })
    await expect(switcher.getByText('123', { exact: true })).toHaveClass(
      /selected/
    )
  })
})
