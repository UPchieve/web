import { describe, expect, it } from 'vitest'
import {
  shouldShowShareInfoModal,
  type ShareInfoModalState,
} from '@/utils/share-info-modal-utils'

const READY: ShareInfoModalState = {
  isFeatureEnabled: true,
  hasChosen: false,
  wasClosedThisVisit: false,
  productFlagsLoaded: true,
  dismissedAt: null,
  numSessionsTutored: 1,
}

describe('shouldShowShareInfoModal', () => {
  it('shows for an undecided coach after their first session', () => {
    expect(shouldShowShareInfoModal(READY)).toBe(true)
  })

  it.each<[string, Partial<ShareInfoModalState>]>([
    ['the feature is off', { isFeatureEnabled: false }],
    ['the coach already chose', { hasChosen: true }],
    ['the coach closed it on this visit', { wasClosedThisVisit: true }],
    ['product flags have not loaded yet', { productFlagsLoaded: false }],
    [
      'the coach dismissed it before, on any device',
      { dismissedAt: '2026-11-03T15:00:00.000Z' },
    ],
    ['the coach has not finished a session', { numSessionsTutored: 0 }],
    ['the session count is unknown', { numSessionsTutored: undefined }],
  ])('does not show when %s', (_, change) => {
    expect(shouldShowShareInfoModal({ ...READY, ...change })).toBe(false)
  })
})
