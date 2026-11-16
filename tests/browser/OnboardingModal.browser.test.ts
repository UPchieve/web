import { render } from 'vitest-browser-vue'
import { expect, test } from 'vitest'
import { page } from '@vitest/browser/context'
import { createStore } from 'vuex'
import OnboardingModal from '@/components/OnboardingModal.vue'

const createMockStore = () =>
  createStore({
    modules: {
      app: { namespaced: true, getters: { mobileMode: () => false } },
    },
  })

// An empty `image` keeps the illustration slot out of the way; the footer is
// what these tests are about.
const pages = [
  {
    step: 1,
    heading: 'Welcome to UPchieve',
    text: 'Free tutoring.',
    image: '',
  },
  { step: 2, heading: 'Get help fast', text: 'Coaches in minutes.', image: '' },
]

/**
 * Renders with the student dashboard's copy, which carries the longest labels
 * either dashboard passes in — the case the old fixed-width footer clipped.
 */
const renderModal = () =>
  render(OnboardingModal, {
    props: {
      closeModal: () => {},
      pages,
      nextButtonText: 'Next',
      acceptButtonText: 'Get started!',
    },
    global: { plugins: [createMockStore()] },
  })

// `tsconfig.vitest.json` builds without the DOM lib, so the element type is
// derived from the locator rather than named outright.
const labelIsClipped = (button: ReturnType<typeof page.getByRole>) => {
  const label = button.element().querySelector('.ButtonTemplate-content')!
  return label.scrollWidth > label.clientWidth
}

test('the forward button shows its full label instead of truncating it', async () => {
  renderModal()

  const next = page.getByRole('button', { name: 'Next' })
  await expect.element(next).toBeVisible()

  expect(labelIsClipped(next)).toBe(false)
})

test('the back button shows its full label instead of truncating it', async () => {
  renderModal()
  await page.getByRole('button', { name: 'Next' }).click()

  const back = page.getByRole('button', { name: 'Back' })
  await expect.element(back).toBeVisible()

  expect(labelIsClipped(back)).toBe(false)
})

test('the final-page accept button shows its full label instead of truncating it', async () => {
  renderModal()
  await page.getByRole('button', { name: 'Next' }).click()

  const accept = page.getByRole('button', { name: 'Get started!' })
  await expect.element(accept).toBeVisible()

  expect(labelIsClipped(accept)).toBe(false)
})

test('the progress dots stay centred even though the two buttons differ in width', async () => {
  renderModal()
  await page.getByRole('button', { name: 'Next' }).click()

  const back = page.getByRole('button', { name: 'Back' })
  await expect.element(back).toBeVisible()

  const footer = back.element().closest('.footer')!
  const dots = footer.querySelector('.dots')!

  const footerBox = footer.getBoundingClientRect()
  const dotsBox = dots.getBoundingClientRect()
  const offCentre =
    dotsBox.left + dotsBox.width / 2 - (footerBox.left + footerBox.width / 2)

  expect(Math.abs(offCentre)).toBeLessThanOrEqual(1)
})
