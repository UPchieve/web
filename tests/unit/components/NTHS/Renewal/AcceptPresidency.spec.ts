import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AcceptPresidency from '@/components/NTHS/Renewal/AcceptPresidency.vue'

describe('AcceptPresidency while submitting', () => {
  it.each(['accept-presidency-cancel', 'accept-presidency-accept'])(
    'disables %s',
    (testid) => {
      const wrapper = mount(AcceptPresidency, {
        props: {
          chapterName: 'Lincoln High NTHS',
          schoolYear: '2027–28',
          submitting: true,
        },
      })

      expect(
        wrapper.get(`[data-testid="${testid}"]`).attributes('disabled')
      ).toBeDefined()
    }
  )
})
