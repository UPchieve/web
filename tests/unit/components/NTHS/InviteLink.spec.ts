import InviteLink from '@/components/NTHS/InviteLink.vue'
import config from '@/config'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.restoreAllMocks())

describe('InviteLink', () => {
  it('copies the link and leaves it selected when the link itself is clicked', async () => {
    // useClipboard is created fresh on this click, and its permission check is
    // async, so it always copies through a hidden textarea and
    // document.execCommand('copy'), in every browser.
    const execCommand = vi.spyOn(document, 'execCommand')
    const wrapper = mount(InviteLink, {
      props: { code: 'HQDEMO' },
      attachTo: document.body,
    })

    await wrapper.find('[data-testid="invite-link-url"]').trigger('click')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(wrapper.text()).toContain('Copied')
    expect(window.getSelection()?.toString()).toBe(
      `${config.appRoot}/join-team/HQDEMO`
    )
    wrapper.unmount()
  })
})
