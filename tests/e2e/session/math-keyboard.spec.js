import { test, expect } from '@playwright/test'
import { getClient } from '../db.ts'
import {
  createStudent,
  endSessionsFor,
  loginStudent,
  requestSession,
  setFeatureFlags,
} from '../utils'
import { POSTHOG_FEATURE_FLAGS } from '../../../src/consts'

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

/**
 * Open the math keyboard, clearing anything that lands on top of the composer.
 *
 * SessionView opens the notifications modal when the browser reports the
 * permission as 'default', and only after getSessionContext() resolves — so it
 * arrives at an unpredictable moment. Headless Chromium reports 'denied' and
 * never shows it, while CI's branded Chrome does, which is how a single
 * dismissal passed locally and hung CI. Dismissing on a retry covers both,
 * along with the download-app banner on mobile viewports.
 */
async function openMathKeyboard(page) {
  await expect(async () => {
    for (const testId of [
      'close-notification-modal',
      'download-app-close-button',
    ]) {
      const closer = page.getByTestId(testId)
      if (await closer.isVisible()) await closer.click({ timeout: 2000 })
    }
    await page.getByTitle('Insert math').click({ timeout: 2000 })
  }).toPass({ timeout: 25000 })
}

let dbClient
test.describe('Session math keyboard', async () => {
  let studentUser

  test.beforeAll(async () => {
    dbClient = await getClient().connect()
    studentUser = await createStudent(dbClient)
  })

  test.afterAll(async () => {
    await endSessionsFor(dbClient, studentUser.id)
    await dbClient.release()
  })

  test('can switch back from the abc layout', async ({ browser }) => {
    const { studentPage, studentDashboard } = await loginStudent(
      browser,
      studentUser
    )
    await setFeatureFlags(studentPage, {
      [POSTHOG_FEATURE_FLAGS.SHOW_TIP_TAP_EDITOR]: true,
    })

    const { sessionId } = await requestSession(studentDashboard, {
      topic: 'prealgebra',
      subject: 'math',
    })

    // The composer reads the flag in mounted(), so it needs a full load with
    // the stubbed flags in place rather than the router push above.
    await studentPage.goto(`/session/math/prealgebra/${sessionId}`)

    await openMathKeyboard(studentPage)
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
