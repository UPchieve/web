import RequirementMeter from '@/components/NTHS/HQ/RequirementMeter.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

function displayedValue(wrapper: ReturnType<typeof mount>): string {
  return wrapper
    .find('[data-testid="meter-value"]')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
}

type MeterProps = InstanceType<typeof RequirementMeter>['$props']

describe('RequirementMeter', () => {
  it.each<{ name: string; props: MeterProps; valuenow: string }>([
    {
      name: 'clamps aria-valuenow to the goal past it',
      props: {
        label: 'Hours tutored',
        value: 52.37,
        goal: 40,
        displayValue: '52.4',
        variant: 'hours',
      },
      valuenow: '40',
    },
    {
      name: 'leaves aria-valuenow unclamped below the goal',
      props: {
        label: 'Members tutoring',
        value: 2,
        goal: 3,
        variant: 'members',
      },
      valuenow: '2',
    },
  ])(
    '$name, with aria-valuetext matching the displayed number',
    ({ props, valuenow }) => {
      const wrapper = mount(RequirementMeter, { props })
      const bar = wrapper.find('[role="progressbar"]')

      expect(bar.attributes('aria-valuenow')).toBe(valuenow)
      expect(bar.attributes('aria-valuetext')).toBe(displayedValue(wrapper))
    }
  )
})
