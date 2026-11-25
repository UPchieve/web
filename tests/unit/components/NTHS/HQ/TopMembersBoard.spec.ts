import TopMembersBoard from '@/components/NTHS/HQ/TopMembersBoard.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { member, NO_PERIOD_ACTIVITY } from '../../../fixtures/nths'

function tutor(userId: string, hours: number) {
  return member({
    userId,
    firstName: userId,
    lastInitial: 'K',
    periodHours: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: hours },
  })
}

function board(
  members: ReturnType<typeof tutor>[],
  props: { isLoading?: boolean } = {}
) {
  return mount(TopMembersBoard, {
    props: { members, currentUserId: 'me', ...props },
  })
}

const ROW = '[data-testid="top-members-row"]'
const VIEWER_ROW = '[data-testid="top-members-viewer-row"]'

describe('TopMembersBoard', () => {
  it('shows only the empty paragraph when nobody has hours', () => {
    const wrapper = board([tutor('me', 0)])

    expect(wrapper.find('[data-testid="top-members-empty"]').exists()).toBe(
      true
    )
    expect(wrapper.find(ROW).exists()).toBe(false)
  })

  it('renders each listed member and the viewer row under them', () => {
    const wrapper = board([tutor('a', 3), tutor('me', 0)])

    expect(wrapper.findAll(ROW)).toHaveLength(1)
    expect(wrapper.find(VIEWER_ROW).exists()).toBe(true)
    expect(wrapper.find(VIEWER_ROW).text()).not.toContain('#')
  })

  it('shows no rows or empty paragraph while loading', () => {
    const wrapper = board([tutor('a', 3)], { isLoading: true })

    expect(wrapper.find(ROW).exists()).toBe(false)
    expect(wrapper.find('[data-testid="top-members-empty"]').exists()).toBe(
      false
    )
  })
})
