import { afterEach, describe, expect, it } from 'vitest'
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils'
import vuetify from '@/plugins/vuetify'
import SortDropdown from '@/components/SortDropdown.vue'

const options = [
  { value: 'recent', label: 'Most recent session' },
  { value: 'oldest', label: 'Oldest session' },
]

describe('SortDropdown', () => {
  // The v-menu panel is teleported out of the component, so tests query the whole document.
  let mounted: VueWrapper | undefined

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  async function mountAndOpen(modelValue = 'recent') {
    mounted = mount(SortDropdown, {
      attachTo: document.body,
      props: { modelValue, options, ariaLabel: 'Sort students' },
      global: { plugins: [vuetify] },
    })
    await mounted.find('[data-testid="sort-dropdown-button"]').trigger('click')
    await flushPromises()
    return { component: mounted, page: new DOMWrapper(document.body) }
  }

  it('shows the selected option on the button', async () => {
    const { component } = await mountAndOpen('oldest')

    const button = component.find('[data-testid="sort-dropdown-button"]')
    expect(button.text()).toBe('Oldest session')
    expect(button.attributes('aria-label')).toBe(
      'Sort students: Oldest session'
    )
  })

  it('lists the options under a "Sort by" heading', async () => {
    const { page } = await mountAndOpen()

    const menu = page.find('[data-testid="sort-dropdown-menu"]')
    expect(menu.attributes('role')).toBe('menu')
    expect(menu.text()).toContain('Sort by')
    expect(menu.findAll('[role="menuitemradio"]')).toHaveLength(2)
  })

  it('marks the selected option as checked, with a filled radio', async () => {
    const { page } = await mountAndOpen('recent')

    const recent = page.find('[data-testid="sort-dropdown-option-recent"]')
    const oldest = page.find('[data-testid="sort-dropdown-option-oldest"]')

    expect(recent.attributes('aria-checked')).toBe('true')
    expect(oldest.attributes('aria-checked')).toBe('false')
    expect(
      recent.find('[data-testid="sort-dropdown-radio"]').classes()
    ).toContain('sort-dropdown__radio--checked')
    expect(
      oldest.find('[data-testid="sort-dropdown-radio"]').classes()
    ).not.toContain('sort-dropdown__radio--checked')
  })

  it('emits the clicked option and closes the menu', async () => {
    const { component, page } = await mountAndOpen('recent')

    await page
      .find('[data-testid="sort-dropdown-option-oldest"]')
      .trigger('click')
    await flushPromises()

    expect(component.emitted('update:modelValue')).toEqual([['oldest']])
    expect(
      component
        .find('[data-testid="sort-dropdown-button"]')
        .attributes('aria-expanded')
    ).toBe('false')
  })

  it('does not emit when the already-selected option is clicked', async () => {
    const { component, page } = await mountAndOpen('recent')

    await page
      .find('[data-testid="sort-dropdown-option-recent"]')
      .trigger('click')
    await flushPromises()

    expect(component.emitted('update:modelValue')).toBeUndefined()
  })
})
