import TopTutorCard from '@/components/NTHS/TopTutorCard.vue'
import { topTutorDetail, viewerHoursLine } from '@/services/NTHSTopTutorService'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { topTutor } from '../../fixtures/nths'

describe('TopTutorCard', () => {
  it("shows the top tutor and the viewer's hours", () => {
    const wrapper = mount(TopTutorCard, {
      props: {
        topTutor: topTutor(),
        currentUserId: 'user-1',
        viewerHoursThisMonth: 3.5,
      },
    })

    expect(wrapper.find('[data-testid="top-tutor"]').text()).toContain(
      'Riley K.'
    )
    expect(wrapper.find('[data-testid="top-tutor-detail"]').text()).toBe(
      topTutorDetail(topTutor())
    )
    expect(wrapper.find('[data-testid="top-tutor-you"]').text()).toBe(
      viewerHoursLine(3.5)
    )
  })

  it('hides the You line when the viewer is the top tutor', () => {
    const wrapper = mount(TopTutorCard, {
      props: {
        topTutor: topTutor(),
        currentUserId: topTutor().userId,
        viewerHoursThisMonth: 4.5,
      },
    })

    expect(wrapper.find('[data-testid="top-tutor-you"]').exists()).toBe(false)
  })

  it('shows the empty state, and still addresses the viewer, when no one has tutored yet', () => {
    const wrapper = mount(TopTutorCard, {
      props: { currentUserId: 'user-1', viewerHoursThisMonth: 0 },
    })

    expect(wrapper.find('[data-testid="top-tutor-empty"]').text()).toBe(
      'No top tutor yet this month'
    )
    expect(wrapper.find('[data-testid="top-tutor-you"]').text()).toBe(
      viewerHoursLine(0)
    )
  })
})
