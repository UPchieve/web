import { describe, expect, it } from 'vitest'
import { namedSuccessorsTitle } from '@/services/NTHSRenewalService'
import type { NTHSRenewalSuccessorPublic } from '@/services/NTHSGroupService'

const VIEWER_ID = 'viewer'
const ANA = { userId: 'viewer', firstName: 'Ana', lastInitial: 'R' }
const LEO = { userId: 'leo', firstName: 'Leo', lastInitial: 'L' }
const SAM = { userId: 'sam', firstName: 'Sam', lastInitial: 'S' }

function successor(
  who: typeof ANA,
  namedBy: typeof ANA | null,
  accepted: boolean | null = null
): NTHSRenewalSuccessorPublic {
  return { ...who, accepted, namedBy }
}

describe('namedSuccessorsTitle', () => {
  it.each([
    {
      name: 'the viewer named themselves',
      successors: [successor(ANA, ANA)],
      title: "Next year's president: you",
    },
    {
      name: 'the viewer named someone, and another member named themselves',
      successors: [successor(LEO, ANA), successor(SAM, SAM)],
      title:
        "Next year's president: Leo L. (named by you) and Sam S. (named by Sam S.)",
    },
    {
      name: 'someone else named the viewer',
      successors: [successor(ANA, LEO)],
      title: "Next year's president: you (named by Leo L.)",
    },
    {
      name: 'three members are named',
      successors: [
        successor(LEO, ANA),
        successor(SAM, SAM),
        successor(ANA, ANA),
      ],
      title:
        "Next year's president: Leo L. (named by you), Sam S. (named by Sam S.) and you",
    },
  ])('words the title when $name', ({ successors, title }) => {
    expect(namedSuccessorsTitle(successors, VIEWER_ID)).toBe(title)
  })
})
