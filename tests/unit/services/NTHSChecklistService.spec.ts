import { describe, expect, it } from 'vitest'
import {
  doneCount,
  doThisNowPick,
  phaseLabel,
  showsDueDate,
  startOpenSectionId,
} from '@/services/NTHSChecklistService'
import type {
  NTHSChecklistItemPublic,
  NTHSChecklistPublic,
} from '@upchieve/api-contracts/nths-checklist'

const item = (
  key: string,
  overrides: Partial<NTHSChecklistItemPublic> = {}
): NTHSChecklistItemPublic => ({
  key,
  order: 1,
  title: key,
  resources: [],
  checkable: true,
  skippable: false,
  status: 'incomplete',
  ...overrides,
})

const checklist = (...sections: NTHSChecklistItemPublic[][]) =>
  ({
    sections: sections.map((items, i) => ({
      id: i + 1,
      title: `S${i + 1}`,
      order: i + 1,
      items,
    })),
  }) as NTHSChecklistPublic

describe('doThisNowPick and startOpenSectionId', () => {
  it.each([
    {
      name: 'first checkable incomplete item in order',
      sections: [[item('a', { status: 'complete' }), item('b'), item('c')]],
      pick: 'b',
      open: 1,
    },
    {
      name: 'skips skipped and uncheckable items, crosses sections',
      sections: [
        [item('a', { status: 'skipped' }), item('i', { checkable: false })],
        [item('b')],
      ],
      pick: 'b',
      open: 2,
    },
    {
      name: 'nothing left',
      sections: [
        [item('a', { status: 'complete' })],
        [item('i', { checkable: false })],
      ],
      pick: undefined,
      open: undefined,
    },
  ])('$name', ({ sections, pick, open }) => {
    const list = checklist(...sections)
    expect(doThisNowPick(list)?.key).toBe(pick)
    expect(startOpenSectionId(list)).toBe(open)
  })
})

describe('doneCount', () => {
  it('counts complete and skipped checkable items only', () => {
    expect(
      doneCount([
        item('complete', { status: 'complete' }),
        item('skipped', { status: 'skipped' }),
        item('incomplete'),
        item('reading', { checkable: false, status: 'complete' }),
      ])
    ).toBe(2)
  })
})

describe('phaseLabel', () => {
  it('numbers only sections with a checkable item', () => {
    const list = checklist(
      [item('a')],
      [item('i', { checkable: false })],
      [item('b')]
    )
    expect(list.sections.map((s) => phaseLabel(list.sections, s.id))).toEqual([
      'Phase 1',
      'All year',
      'Phase 2',
    ])
  })
})

describe('showsDueDate', () => {
  const now = new Date(2026, 10, 24, 15, 0)
  it.each([
    [new Date(2026, 10, 23, 23, 59), false],
    [new Date(2026, 10, 24, 0, 0), true],
    [new Date(2026, 10, 25, 9, 0), true],
  ])('%s -> %s', (date, expected) => {
    expect(showsDueDate(date.toISOString(), now)).toBe(expected)
  })
})
