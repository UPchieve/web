import ResourceLinksCard from '@/components/NTHS/HQ/ResourceLinksCard.vue'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

describe('ResourceLinksCard', () => {
  it('routes an app path and opens any other link in a new tab', () => {
    const wrapper = mount(ResourceLinksCard, {
      props: {
        links: [
          {
            title: 'Inside',
            body: 'b1',
            link: '/groups/resources',
            forMembers: true,
          },
          {
            title: 'Outside',
            body: 'b2',
            link: 'https://x.org',
            forMembers: true,
          },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const router = wrapper.findComponent(RouterLinkStub)
    expect(router.props('to')).toBe('/groups/resources')
    expect(router.attributes('target')).toBeUndefined()
    const external = wrapper
      .findAll('[data-testid="resource-link"]')
      .find((a) => a.attributes('href') === 'https://x.org')!
    expect(external.attributes('target')).toBe('_blank')
    expect(external.attributes('rel')).toBe('noopener noreferrer')
  })
})
