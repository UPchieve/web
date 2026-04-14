import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  hasPermanentlyDismissedSecondaryEmailModal,
  hasTemporarilyDismissedSecondaryEmailModal,
  isTargetEmailDomain,
  setPermanentlyDismissSecondaryEmailModal,
  setTemporarilyDismissSecondaryEmailModal,
} from '../../../src/utils/secondary-email-modal-utils'
import { dayjs } from '@/utils/time-utils'

const userId = 'user123'
describe('Secondary email modal utils', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('hasPermanentlyDismissedSecondaryEmailModal', () => {
    it.each([
      [false, 12],
      [false, 13],
      [true, 1],
      [true, 11],
    ])(
      'Returns %s if the modal was last dismissed %s months ago',
      (expected, monthsAgo) => {
        const date = dayjs().subtract(monthsAgo, 'months').toDate()
        setPermanentlyDismissSecondaryEmailModal(userId, date)
        expect(hasPermanentlyDismissedSecondaryEmailModal(userId)).toEqual(
          expected
        )
      }
    )
  })

  describe('hasTemporarilyDismissedSecondaryEmailModal', () => {
    it('Returns true if the modal was dismissed in this session', () => {
      setTemporarilyDismissSecondaryEmailModal(userId)
      expect(hasTemporarilyDismissedSecondaryEmailModal(userId)).toEqual(true)
    })
    it('Returns false if the modal was not dismissed in this session', () => {
      expect(hasTemporarilyDismissedSecondaryEmailModal(userId)).toEqual(false)
    })
  })

  describe('isTargetEmailDomain', () => {
    it.each([
      [false, 'louise.belcher@upchieve.org'],
      [false, 'louise.belcherk12@upchieve.org'],
      [false, 'louise.belcher.isd@upchieve.org'],
      [false, 'louise.belcher.eduedu@upchieve.org'],
      [true, 'louise.belcher@someschool.edu'],
      [true, 'louisebelcher@someschool.k12.org'],
      [true, 'louisebelcher@someschoolk12.org'],
      [true, 'louisebelcher@someschool.isd.blah.us'],
    ])('Returns %s for email %s', (expected: boolean, value: string) => {
      expect(isTargetEmailDomain(value)).toEqual(expected)
    })
  })
})
