import DirectMessagePanel from '@/components/DirectMessagePanel.vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

function mountPanel() {
  return mount(DirectMessagePanel, {
    props: {
      partnerId: 'coach-1',
      partnerName: 'Alex',
      partnerType: 'coach',
    },
    global: {
      plugins: [
        createStore({
          modules: {
            app: {
              namespaced: true,
              getters: { mobileMode: () => false },
            },
          },
        }),
      ],
      // Use the real Transition so the close is emitted after the panel
      // slides out
      stubs: { transition: false, DirectMessageChat: true },
    },
  })
}

describe('DirectMessagePanel', () => {
  let wrapper: ReturnType<typeof mountPanel> | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('shows the partner name and passes the conversation to the chat', () => {
    wrapper = mountPanel()

    expect(wrapper.find('.dm-panel__name').text()).toBe('Alex')
    expect(
      wrapper.findComponent({ name: 'DirectMessageChat' }).props()
    ).toEqual({
      partnerId: 'coach-1',
      partnerName: 'Alex',
    })
  })

  it('emits close when the close button is clicked', async () => {
    wrapper = mountPanel()

    await wrapper.find('[data-testid="dm-panel-close"]').trigger('click')

    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
  })

  it('emits close when the grayed-out background is clicked', async () => {
    wrapper = mountPanel()

    await wrapper.find('[data-testid="dm-panel-scrim"]').trigger('click')

    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
  })

  it('slides out before emitting close', async () => {
    wrapper = mountPanel()

    await wrapper.find('[data-testid="dm-panel-close"]').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
    expect(wrapper.find('.dm-panel').exists()).toBe(false)
  })

  it('does not close when clicking inside the panel', async () => {
    wrapper = mountPanel()

    await wrapper.find('.dm-panel').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits close when Escape is pressed', async () => {
    wrapper = mountPanel()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
  })

  it('locks page scrolling while open', () => {
    wrapper = mountPanel()
    expect(document.body.classList.contains('disable-scroll')).toBe(true)

    wrapper.unmount()
    wrapper = undefined
    expect(document.body.classList.contains('disable-scroll')).toBe(false)
  })
})
