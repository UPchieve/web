import Menu from '@/components/Menu.vue'
import { it, describe, expect, afterEach } from 'vitest'
import { createStore } from 'vuex'
import vuetify from '@/plugins/vuetify'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

describe('Menu', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    wrapper.unmount()
    // Ionic hoists a presented ion-modal to <ion-app> (or body); make sure none leaks between tests
    document.querySelectorAll('ion-modal').forEach((el) => el.remove())
  })

  function getWrapper({ mobileMode }: { mobileMode: boolean }) {
    const store = createStore({
      modules: {
        app: {
          namespaced: true,
          getters: {
            mobileMode: () => mobileMode,
          },
        },
      },
    })
    wrapper = mount(Menu, {
      attachTo: document.body,
      props: {
        isOpen: true,
        location: 'bottom',
        buttonHeightPx: 12,
        caretThickness: 'bold',
      },
      slots: {
        content: '<div data-testid="menu-content">content</div>',
      },
      global: {
        plugins: [store, vuetify],
      },
    })
  }

  async function clickOutside() {
    // Vuetify's click-outside directive arms on a document-level mousedown and fires on the following click
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()
  }

  it('emits update:isOpen=false when the mobile sheet reports didDismiss', async () => {
    getWrapper({ mobileMode: true })
    await nextTick()

    const modal = document.querySelector('ion-modal')
    expect(modal).not.toBeNull()

    modal!.dispatchEvent(new CustomEvent('didDismiss'))
    await nextTick()

    expect(wrapper.emitted('update:isOpen')).toEqual([[false]])
  })

  it('does not close the mobile sheet on a click outside the v-menu content', async () => {
    getWrapper({ mobileMode: true })
    await nextTick()

    await clickOutside()

    expect(wrapper.emitted('update:isOpen') ?? []).not.toContainEqual([false])
  })

  it('closes the desktop popover on a click outside', async () => {
    getWrapper({ mobileMode: false })
    await nextTick()
    expect(
      document.querySelector('[data-testid="menu-content"]')
    ).not.toBeNull()

    await clickOutside()

    expect(wrapper.emitted('update:isOpen') ?? []).toContainEqual([false])
  })
})
