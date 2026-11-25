import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { afterEach, describe, expect, it } from 'vitest'
import ModalTemplate from '@/components/App/AppModal/ModalTemplate.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.replaceChildren()
})

function mountModal(slot: string) {
  const opener = document.createElement('button')
  document.body.appendChild(opener)
  opener.focus()
  const store = createStore({
    getters: { 'app/mobileMode': () => false },
  })
  const wrapper = mount(ModalTemplate, {
    attachTo: document.body,
    global: { plugins: [store] },
    slots: { default: slot },
  })
  return { wrapper, opener }
}

describe('ModalTemplate', () => {
  it('returns focus to the element that was focused when it opened', () => {
    const { wrapper, opener } = mountModal('<input type="text" />')
    expect(document.activeElement).not.toBe(opener)

    wrapper.unmount()

    expect(document.activeElement).toBe(opener)
  })

  it('focuses the checked radio first', () => {
    mountModal(`<fieldset>
      <input type="radio" name="r" value="a" data-testid="a" />
      <input type="radio" name="r" value="b" data-testid="b" checked />
    </fieldset>`)

    expect(document.activeElement?.getAttribute('data-testid')).toBe('b')
  })

  it('is a modal dialog named by its legend', async () => {
    const { wrapper } = mountModal(
      '<fieldset><legend data-testid="title">Change title</legend><input type="radio" /></fieldset>'
    )
    await flushPromises()
    const dialog = wrapper.find('[data-testid="modal-dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(
      document.getElementById(dialog.attributes('aria-labelledby') ?? '')
    ).toBe(wrapper.find('[data-testid="title"]').element)
  })

  it('takes its name from a heading that renders after it opens', async () => {
    const { wrapper } = mountModal('<div data-testid="body"></div>')
    const heading = document.createElement('h2')
    wrapper.find('[data-testid="body"]').element.appendChild(heading)
    await flushPromises()

    expect(
      document.getElementById(
        wrapper
          .find('[data-testid="modal-dialog"]')
          .attributes('aria-labelledby') ?? ''
      )
    ).toBe(heading)
  })

  it('keeps Shift+Tab inside the dialog from a checked radio that is not first', () => {
    const { wrapper } = mountModal(`<fieldset>
      <input type="radio" name="r" value="a" />
      <input type="radio" name="r" value="b" data-testid="b" checked />
    </fieldset>`)
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    document.activeElement?.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement?.textContent).toBe('Back')
    wrapper.unmount()
  })

  it.each([
    {
      from: 'the first field',
      slot: '<input data-testid="from" /><input />',
      wraps: true,
    },
    {
      from: 'a radio in another group',
      slot: '<input type="radio" name="r" checked /><input type="radio" name="s" data-testid="from" />',
      wraps: false,
    },
    {
      from: 'a field after a radio group',
      slot: '<input type="radio" name="r" checked /><input data-testid="from" />',
      wraps: false,
    },
  ])('wraps Shift+Tab from $from: $wraps', ({ slot, wraps }) => {
    const { wrapper } = mountModal(slot)
    const from = wrapper.find<HTMLElement>('[data-testid="from"]').element
    from.focus()
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    from.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(wraps)
  })
})
