import CoachInfoPopover from '@/components/CoachInfoPopover.vue'
import type { VolunteerPublicProfileInfoShared } from '@/types/sessions'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

function mountPopover(
  info: VolunteerPublicProfileInfoShared,
  props: { subject?: string; isFavorite?: boolean } = {}
) {
  return mount(CoachInfoPopover, {
    props: { name: 'Nalini', info, ...props },
  })
}

function texts(wrapper: ReturnType<typeof mountPopover>, testId: string) {
  return wrapper
    .findAll(`[data-testid="${testId}"]`)
    .map((el) => el.text().replace(/\s+/g, ' '))
}

describe('CoachInfoPopover', () => {
  it('shows the name, occupations and last session subject', () => {
    const wrapper = mountPopover(
      { occupation: ['Working full-time'] },
      { subject: 'College Counseling' }
    )

    expect(wrapper.find('.coach-info__name').text()).toBe('Nalini')
    expect(texts(wrapper, 'coach-info-detail')).toEqual([
      'Working full-time',
      'College Counseling',
    ])
  })

  it('shows only the stats the coach shared, with short labels', () => {
    const wrapper = mountPopover({
      numSessionsTutored: 3,
      numStudentsHelped: 1,
    })

    const stats = wrapper
      .findAll('[data-testid="coach-info-stat"]')
      .map(
        (stat) =>
          `${stat.find('.coach-info__stat-value').text()} ${stat.find('.coach-info__stat-label').text()}`
      )
    expect(stats).toEqual(['3 sessions', '1 student'])
  })

  it('hides the stats panel when no stats were shared', () => {
    const wrapper = mountPopover({ occupation: ['Working full-time'] })

    expect(wrapper.find('.coach-info__stats').exists()).toBe(false)
  })

  it('shows the favorite star only for favorite coaches', () => {
    expect(
      mountPopover({ numSessionsTutored: 1 })
        .find('[data-testid="coach-info-favorite"]')
        .exists()
    ).toBe(false)
    expect(
      mountPopover({ numSessionsTutored: 1 }, { isFavorite: true })
        .find('[data-testid="coach-info-favorite"]')
        .exists()
    ).toBe(true)
  })
})
