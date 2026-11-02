import { describe, expect, it } from 'vitest'
import {
  namedSuccessorsTitle,
  successorPickerHint,
} from '@/services/NTHSRenewalService'
import type {
  NTHSRenewalPublic,
  NTHSRenewalSuccessorPublic,
} from '@/services/NTHSGroupService'

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

describe('successorPickerHint', () => {
  it.each([
    {
      namingSelfAccepts: false,
      hint: "Name one or more members. They'll be notified and can accept starting Aug 1. You can change who's named until Sept 14.",
    },
    {
      namingSelfAccepts: true,
      hint: "Name one or more members. They'll be notified and can accept right away. You can change who's named until Sept 14, or until someone accepts.",
    },
  ])(
    'words the hint when accepting right away is $namingSelfAccepts',
    ({ namingSelfAccepts, hint }) => {
      const renewal = {
        successorConfirmationOn: '2027-08-01',
        namingClosesOn: '2027-09-14',
        namingSelfAccepts,
      } as NTHSRenewalPublic

      expect(successorPickerHint(renewal)).toBe(hint)
    }
  )
})
