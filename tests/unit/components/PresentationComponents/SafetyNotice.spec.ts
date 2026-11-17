import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SafetyNotice from '@/components/PresentationComponents/SafetyNotice.vue'

describe('SafetyNotice', () => {
  it('renders the session chat safety notice', () => {
    const wrapper = mount(SafetyNotice, { props: { type: 'session-chat' } })

    expect(wrapper.text()).toBe(
      'We review every session. Please be respectful.'
    )
  })

  it('renders the direct message chat safety notice', () => {
    const wrapper = mount(SafetyNotice, {
      props: { type: 'direct-message-chat' },
    })

    expect(wrapper.text()).toBe(
      'We review every conversation. Please be respectful.'
    )
  })

  it('passes attributes through to the root element', () => {
    const wrapper = mount(SafetyNotice, {
      props: { type: 'session-chat' },
      attrs: { 'data-testid': 'chat-safety-notice' },
    })

    expect(wrapper.attributes('data-testid')).toBe('chat-safety-notice')
  })
})
