import { mount } from '@vue/test-utils'
import { h, withDirectives } from 'vue'
import { describe, it, expect } from 'vitest'
import { vPh } from '@/directives/ph'

const attributeFor = (value: string) =>
  mount({
    render: () => withDirectives(h('button'), [[vPh, value, 'nthshq']]),
  }).attributes('data-ph-capture-attribute-nthshq')

describe('vPh', () => {
  it.each([
    ['members.download_csv', 'members.download_csv'],
    ['todo.checkbox.NAMED YOUR TEAM', 'todo.checkbox.named_your_team'],
    ['members.period.lastTwoWeeks', 'members.period.last_two_weeks'],
    [
      'members.filter.not-tutored-in-period',
      'members.filter.not_tutored_in_period',
    ],
  ])('writes %s as %s', (value, expected) => {
    expect(attributeFor(value)).toBe(expected)
  })
})
