import TutorInfoCard from '@/components/TutorInfoCard.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { it, describe, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const INFO = {
  occupation: ['Working full-time'],
  numSessionsTutored: 12,
}

function getWrapper(props = {}) {
  return mount(TutorInfoCard, {
    props: {
      info: INFO,
      viewerRole: 'student',
      sessionId: 'session-1',
      volunteerId: 'volunteer-1',
      ...props,
    },
  })
}

function captureCalls(event: string) {
  return (AnalyticsService.captureEvent as any).mock.calls.filter(
    ([name]: [string]) => name === event
  )
}

describe('TutorInfoCard analytics', () => {
  beforeEach(() => {
    vi.spyOn(AnalyticsService, 'captureEvent').mockImplementation(() => {})
    ;(AnalyticsService.captureEvent as any).mockClear()
  })

  it('records that the student saw the card, with the session, coach and fields shown', () => {
    getWrapper()

    expect(captureCalls(EVENTS.STUDENT_SAW_LEARN_MORE_ABOUT_COACH)).toEqual([
      [
        EVENTS.STUDENT_SAW_LEARN_MORE_ABOUT_COACH,
        {
          sessionId: 'session-1',
          volunteerId: 'volunteer-1',
          fieldsShown: ['occupation', 'numSessionsTutored'],
        },
      ],
    ])
  })

  it('does not record a view for the volunteer preview', () => {
    getWrapper({ viewerRole: 'volunteer' })

    expect(captureCalls(EVENTS.STUDENT_SAW_LEARN_MORE_ABOUT_COACH)).toEqual([])
  })

  it('records the first expand with the session and coach', async () => {
    const wrapper = getWrapper()

    await wrapper.find('.tutor-info-toggle').trigger('click')

    expect(captureCalls(EVENTS.STUDENT_CLICKED_LEARN_MORE_ABOUT_COACH)).toEqual(
      [
        [
          EVENTS.STUDENT_CLICKED_LEARN_MORE_ABOUT_COACH,
          { sessionId: 'session-1', volunteerId: 'volunteer-1' },
        ],
      ]
    )
  })
})
