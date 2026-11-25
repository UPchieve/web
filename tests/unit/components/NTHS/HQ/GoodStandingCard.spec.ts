import GoodStandingCard from '@/components/NTHS/HQ/GoodStandingCard.vue'
import type { NTHSChapterImpactPublic } from '@upchieve/api-contracts/nths-groups'
import { impact } from '../../../fixtures/nths'
import vuetify from '@/plugins/vuetify'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('GoodStandingCard', () => {
  let mounted: VueWrapper | undefined

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  function card(impact?: NTHSChapterImpactPublic) {
    mounted = mount(GoodStandingCard, {
      attachTo: document.body,
      props: { impact },
      global: { plugins: [vuetify] },
    })
    return mounted
  }

  it('hides the placeholder numbers from assistive tech while loading', () => {
    const wrapper = card()

    expect(
      wrapper
        .find('[data-testid="good-standing-loading"]')
        .attributes('aria-busy')
    ).toBe('true')
    expect(
      wrapper
        .find('[data-testid="good-standing-meters"]')
        .attributes('aria-hidden')
    ).toBe('true')
  })

  it('exposes the real numbers once loaded, with nothing hidden', () => {
    const wrapper = card(impact())

    expect(
      wrapper
        .find('[data-testid="good-standing-meters"]')
        .attributes('aria-hidden')
    ).toBeUndefined()
  })

  it.each([
    {
      name: 'pending',
      overrides: { official: false },
      text: 'Your chapter will be official with 3 active members who have each tutored at least once, and in good standing with 40 hours tutored this school year.',
    },
    {
      name: 'official',
      overrides: {
        official: true,
        schoolYearToDate: { ...impact().schoolYearToDate, hoursTutored: 3 },
      },
      text: 'Your chapter is official. It will be in good standing with 40 hours tutored this school year.',
    },
    {
      name: 'official-good-standing',
      overrides: {
        official: true,
        schoolYearToDate: { ...impact().schoolYearToDate, hoursTutored: 40 },
      },
      text: 'Your chapter is in good standing with 3 active members who have each tutored at least once, and 40 hours tutored this school year.',
    },
  ])('describes the $name standing in the tooltip', ({ overrides, text }) => {
    const wrapper = card(impact(overrides))

    expect(wrapper.find('[data-testid="goals-tooltip"]').text()).toBe(text)
  })

  it.each([
    { device: 'one that hovers', canHover: true },
    { device: 'a touch screen', canHover: false },
  ])(
    'leaves the tooltip open after mouseenter then click on $device',
    async ({ canHover }) => {
      const matchMedia = window.matchMedia.bind(window)
      vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
        query === '(hover: hover)'
          ? ({ matches: canHover } as MediaQueryList)
          : matchMedia(query)
      )
      const wrapper = card(impact())
      const button = wrapper.find('[data-testid="goals-info-button"]')
      const tooltip = wrapper.find('[data-testid="goals-tooltip"]')

      expect(tooltip.element.checkVisibility()).toBe(false)
      await button.trigger('mouseenter')
      await button.trigger('click')
      await flushPromises()
      expect(tooltip.element.checkVisibility()).toBe(true)
    }
  )
})
