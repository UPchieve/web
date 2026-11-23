import RosterRangePicker from '@/components/NTHS/Members/RosterRangePicker.vue'
import vuetify from '@/plugins/vuetify'
import type { RosterRange } from '@/services/NTHSRosterService'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

const RANGE: RosterRange = {
  firstDay: new Date(2026, 9, 5),
  lastDay: new Date(2026, 9, 11),
}

enableAutoUnmount(afterEach)

async function openPicker(range: RosterRange = RANGE) {
  const wrapper = mount(RosterRangePicker, {
    props: {
      range,
      earliestDay: new Date(2026, 9, 3),
      latestDay: new Date(2026, 9, 15),
    },
    global: { plugins: [vuetify] },
    attachTo: 'body',
  })
  await wrapper.find('[data-testid="roster-range-button"]').trigger('click')
  await flushPromises()
  return wrapper
}

function find(selector: string) {
  return document.querySelector<HTMLElement>(selector)
}

async function click(selector: string) {
  find(selector)!.click()
  await nextTick()
}

describe('RosterRangePicker', () => {
  it.each([
    [RANGE, 'Oct 5 – Oct 11'],
    [{ ...RANGE, period: 'thisMonth' as const }, 'This month'],
  ])('shows the range on its button', async (range, label) => {
    const wrapper = await openPicker(range)

    expect(wrapper.find('[data-testid="roster-range-button"]').text()).toBe(
      label
    )
  })

  it('offers only the days from the earliest through the latest', async () => {
    await openPicker()

    const days = Array.from(document.querySelectorAll('[data-v-date]'), (day) =>
      day.getAttribute('data-v-date')
    )
    expect(days[0]).toBe('2026-10-03')
    expect(days.at(-1)).toBe('2026-10-15')
  })

  it('seeds the calendar with the UTC date of the school year start', async () => {
    await openPicker({
      period: 'thisSchoolYear',
      firstDay: new Date('2026-10-04T00:00:00Z'),
      lastDay: new Date(2026, 9, 11),
    })

    const selected = (day: string) =>
      find(`[data-v-date="${day}"]`)!
        .closest('.v-date-picker-month__day')!
        .classList.contains('v-date-picker-month__day--selected')
    expect(selected('2026-10-04')).toBe(true)
    expect(selected('2026-10-03')).toBe(false)
  })

  it('emits a quick pick by name', async () => {
    const wrapper = await openPicker()

    await click('[data-testid="roster-range-allTime"]')

    expect(wrapper.emitted('pickPeriod')).toEqual([['allTime']])
  })

  it.each([
    ['two days', ['2026-10-06', '2026-10-08'], new Date(2026, 9, 8)],
    ['one day', ['2026-10-06'], new Date(2026, 9, 6)],
  ])(
    'emits %s picked on the calendar as whole days',
    async (_, picked, lastDay) => {
      const wrapper = await openPicker()

      for (const day of picked) await click(`[data-v-date="${day}"]`)
      await click('[data-testid="roster-range-done"]')

      expect(wrapper.emitted('pickDays')).toEqual([
        [new Date(2026, 9, 6), lastDay],
      ])
    }
  )
})
