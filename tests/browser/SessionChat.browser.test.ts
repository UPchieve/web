import { render } from 'vitest-browser-vue'
import { expect, test } from 'vitest'
import { page } from '@vitest/browser/context'
import SessionChat from '@/views/SessionView/SessionChat/index.vue'
import {
  createVoiceChatMockStore,
  createVoiceChatMockSession,
} from './SessionChat.fixtures'

test('voice chat in-progress captions render correctly', async () => {
  const store = createVoiceChatMockStore()
  const mockSession = createVoiceChatMockSession()

  render(SessionChat, {
    props: {
      currentSession: mockSession,
      isSocketSessionRoomConnected: true,
      isSessionAlive: true,
      shouldHideChatSection: false,
      setHasSeenNewMessage: () => {},
      isFetchingIsSessionRecapEligible: false,
      isSessionRecapEligible: false,
      sessionHasEnded: false,
      aiWidgetPresent: false,
      isInRecap: false,
    },
    global: {
      plugins: [store],
      stubs: {
        DocumentTitle: true,
      },
    },
  })

  await expect
    .element(page.getByText('This is a really long message from me'))
    .toBeVisible()
  await expect
    .element(page.getByText('Hello, this is a completed message'))
    .toBeVisible()
  await expect
    .element(page.getByText('This is a completed transcription'))
    .toBeVisible()
  await expect
    .element(page.getByText('I am speaking right now...'))
    .toBeVisible()
  await expect.element(page.getByText('They are speaking too...')).toBeVisible()

  /**
   * If we want, we can run snapshot tests using vitest on individual components.
   *
   * I've left this here for feature discovery but not doing it for now. I look at
   * the vitest UI and check it visually manually. But you could imagine using this
   * in the future.
   *
   * @see https://main.vitest.dev/guide/browser/visual-regression-testing.html
   *
   * ```ts
   * import { expect, test } from 'vitest'
   * import { page } from 'vitest/browser'
   *
   * test('hero section looks correct', async () => {   *
   *   await expect(page.getByTestId('hero')).toMatchScreenshot('hero-section')
   * })
   * ```
   */
})
