import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DocumentTitle from '@/components/DocumentTitle.vue'

describe('DocumentTitle', () => {
  it('sets the title while mounted and restores the previous one on unmount', () => {
    document.title = 'UPchieve'
    const wrapper = mount(DocumentTitle, { props: { title: 'Manage' } })
    expect(document.title).toBe('Manage')

    wrapper.unmount()

    expect(document.title).toBe('UPchieve')
  })
})
