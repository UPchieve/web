import { describe, expect, it } from 'vitest'
import type {
  NTHSRosterMemberPublic,
  NTHSTitle,
} from '@/services/NTHSGroupService'
import {
  displayTitle,
  presidencyChoiceLabel,
  roleLabel,
  roleTagLabel,
} from '@/services/NTHSRosterService'
import { member } from '../fixtures/nths'

let nextId = 0
function titled(
  title: NTHSTitle,
  overrides: Partial<NTHSRosterMemberPublic> = {}
): NTHSRosterMemberPublic {
  nextId += 1
  return member({
    userId: `member-${nextId}`,
    roleName: title === 'Member' ? 'member' : 'admin',
    title,
    ...overrides,
  })
}

describe('displayTitle', () => {
  it.each([
    [
      'one current president',
      ['President', 'Member'],
      ['President', undefined],
    ],
    [
      'two current presidents',
      ['President', 'President'],
      ['Co-President', 'Co-President'],
    ],
    [
      'a president and a vice president',
      ['President', 'Vice President'],
      ['President', 'Vice President'],
    ],
  ] as const)('with %s', (_label, titles, expected) => {
    const roster = titles.map((title) => titled(title))
    expect(roster.map((m) => displayTitle(m, roster))).toEqual(expected)
  })

  it('shows the remaining co-president as President once the other closes their account', () => {
    const remaining = titled('President')
    const roster = [remaining, titled('President', { accountClosed: true })]
    expect(displayTitle(remaining, roster)).toBe('President')
  })
})

describe('presidencyChoiceLabel', () => {
  it.each([
    ['nobody holds it', [titled('Member'), titled('Vice President')]],
    [
      'only a closed account holds it',
      [titled('Member'), titled('President', { accountClosed: true })],
    ],
  ])('offers President when %s', (_label, roster) => {
    expect(presidencyChoiceLabel(roster, roster[0].userId)).toBe('President')
  })

  it('offers Co-President when someone else is the current president', () => {
    const editing = titled('Member', { roleName: 'admin' })
    const roster = [titled('President'), editing]
    expect(presidencyChoiceLabel(roster, editing.userId)).toBe('Co-President')
  })

  it('offers President to the sole president editing their own title', () => {
    const president = titled('President')
    const roster = [president, titled('Member')]
    expect(presidencyChoiceLabel(roster, president.userId)).toBe('President')
  })
})

describe('roleTagLabel', () => {
  it.each([
    ['an untitled admin', 'Admin', titled('Member', { roleName: 'admin' })],
    ['an untitled plain member', undefined, titled('Member')],
    [
      'a plain member on the executive board',
      'Executive Board Member',
      titled('Executive Board Member', { roleName: 'member' }),
    ],
    ['a lone president', 'President', titled('President')],
    [
      'an admin whose account is closed',
      undefined,
      titled('Member', { roleName: 'admin', accountClosed: true }),
    ],
    [
      'a president whose account is closed',
      undefined,
      titled('President', { accountClosed: true }),
    ],
  ])('badges %s: %s', (_label, expected, subject) => {
    const roster = [subject, titled('Member')]
    expect(roleTagLabel(subject, roster)).toBe(expected)
  })
})

describe('roleLabel', () => {
  it.each([
    ['a lone president', 'President', [titled('President')]],
    [
      'an untitled admin',
      'Chapter admin',
      [titled('Member', { roleName: 'admin' })],
    ],
    ['an untitled plain member', 'Member', [titled('Member')]],
  ] as const)('describes %s as %s', (_label, expected, roster) => {
    expect(roleLabel(roster[0], [...roster])).toBe(expected)
  })
})
