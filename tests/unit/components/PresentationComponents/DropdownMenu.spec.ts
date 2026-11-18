import { afterEach, describe, expect, it } from 'vitest'
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils'
import vuetify from '@/plugins/vuetify'
import DropdownMenu from '@/components/PresentationComponents/DropdownMenu.vue'

describe('DropdownMenu', () => {
  // The v-menu panel is teleported out of the component, so tests query the whole document.
  // Unmount after each test so one test's menu doesn't answer the next one's queries.
  let mounted: VueWrapper | undefined

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  function mountMenu(options: { props?: object; slots?: object } = {}) {
    mounted = mount(DropdownMenu, {
      attachTo: document.body,
      props: { label: 'Most recent session', testId: 'test', ...options.props },
      slots: {
        default: '<button data-testid="menu-item">Item</button>',
        ...options.slots,
      },
      global: { plugins: [vuetify] },
    })
    return { component: mounted, page: new DOMWrapper(document.body) }
  }

  it('renders the label on the button', () => {
    const { component } = mountMenu()

    expect(component.find('[data-testid="test-button"]').text()).toBe(
      'Most recent session'
    )
  })

  it('opens the menu and shows the slot content when the button is clicked', async () => {
    const { component, page } = mountMenu()

    expect(page.find('[data-testid="menu-item"]').exists()).toBe(false)

    await component.find('[data-testid="test-button"]').trigger('click')
    await flushPromises()

    expect(page.find('[data-testid="test-menu"]').exists()).toBe(true)
    expect(page.find('[data-testid="menu-item"]').exists()).toBe(true)
    expect(
      component.find('[data-testid="test-button"]').attributes('aria-expanded')
    ).toBe('true')
    expect(component.emitted('update:open')?.[0]).toEqual([true])
  })

  it('closes the menu when the parent sets open to false', async () => {
    const { component, page } = mountMenu({ props: { open: true } })
    await flushPromises()
    expect(page.find('[data-testid="menu-item"]').exists()).toBe(true)

    await component.setProps({ open: false })
    await flushPromises()

    expect(
      component.find('[data-testid="test-button"]').attributes('aria-expanded')
    ).toBe('false')
  })

  it('applies the menu role and aria-label to the panel', async () => {
    const { page } = mountMenu({
      props: { open: true, menuRole: 'menu', menuAriaLabel: 'Sort students' },
    })
    await flushPromises()

    const panel = page.find('[data-testid="test-menu"]')
    expect(panel.attributes('role')).toBe('menu')
    expect(panel.attributes('aria-label')).toBe('Sort students')
  })

  it('marks the button active', () => {
    const { component } = mountMenu({ props: { active: true } })

    expect(component.find('[data-testid="test-button"]').classes()).toContain(
      'dropdown-menu__button--active'
    )
  })

  it('uses the leading-icon padding only when a leading icon is given', () => {
    const withIcon = mountMenu({
      slots: { 'leading-icon': '<svg data-testid="icon" />' },
    }).component
    expect(withIcon.find('[data-testid="icon"]').exists()).toBe(true)
    expect(withIcon.find('[data-testid="test-button"]').classes()).toContain(
      'dropdown-menu__button--leading-icon'
    )
    withIcon.unmount()

    const withoutIcon = mountMenu().component
    expect(
      withoutIcon.find('[data-testid="test-button"]').classes()
    ).not.toContain('dropdown-menu__button--leading-icon')
  })
})
