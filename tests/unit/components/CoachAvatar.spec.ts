import CoachAvatar from '@/components/CoachAvatar.vue'
import PresenceDot from '@/components/PresenceDot.vue'
import store from '@/store'
import type { VolunteerStatus } from '@/types/users'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

function mountAvatar(
  props: { status?: VolunteerStatus } = {},
  slots: Record<string, string> = {}
) {
  return mount(CoachAvatar, { props, slots })
}

function mockCoachStatusFlag(isEnabled: boolean) {
  vi.spyOn(store, 'getters', 'get').mockReturnValue({
    'featureFlags/isShowCoachStatusEnabled': isEnabled,
  })
}

describe('CoachAvatar', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the badge slot only when one is passed', () => {
    expect(
      mountAvatar().find('[data-testid="coach-avatar-badge"]').exists()
    ).toBe(false)

    const wrapper = mountAvatar({}, { badge: '<span>Star</span>' })
    expect(wrapper.find('[data-testid="coach-avatar-badge"]').text()).toBe(
      'Star'
    )
  })

  it('shows the presence dot when there is a status and the flag is on', () => {
    mockCoachStatusFlag(true)
    const dot = mountAvatar({ status: 'online' }).findComponent(PresenceDot)

    expect(dot.exists()).toBe(true)
    expect(dot.props('status')).toBe('online')
  })

  it('hides the presence dot when the flag is off or there is no status', () => {
    mockCoachStatusFlag(true)
    expect(mountAvatar().findComponent(PresenceDot).exists()).toBe(false)

    mockCoachStatusFlag(false)
    expect(
      mountAvatar({ status: 'online' }).findComponent(PresenceDot).exists()
    ).toBe(false)
  })
})
