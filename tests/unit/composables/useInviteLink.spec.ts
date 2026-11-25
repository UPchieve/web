import { useInviteLink } from '@/composables/useInviteLink'
import config from '@/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('useInviteLink', () => {
  const originalAppRoot = config.appRoot
  beforeEach(() => {
    config.appRoot = 'https://app.upchieve.org'
  })
  afterEach(() => {
    config.appRoot = originalAppRoot
    document.body.innerHTML = ''
  })

  it('shows the link without protocol or query and copies the full one', () => {
    const { displayLink } = useInviteLink('ABC123', 'PERSON123')

    expect(displayLink.value).toBe('app.upchieve.org/join-team/ABC123')
  })

  it('returns focus to the element that had it after copying', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    let copied = ''
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      copied = (document.activeElement as HTMLTextAreaElement).value
      return true
    })

    useInviteLink('ABC123', 'PERSON123').copyLink()

    expect(copied).toContain('/join-team/ABC123?referral=PERSON123')
    expect(document.activeElement).toBe(button)
  })
})
