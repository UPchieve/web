import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  NTHS_APPLICATION_FORMS,
  type NTHSApplicationDraft,
  type NTHSFormVersion,
} from '@/services/NTHSApplicationService'
import {
  clearNTHSApplicationDraft,
  getNTHSApplicationDraft,
  setNTHSApplicationDraft,
} from '@/services/BrowserStorageService'

const [FORM_VERSION] = Object.keys(NTHS_APPLICATION_FORMS).map(
  Number
) as NTHSFormVersion[]

const DRAFT: NTHSApplicationDraft = {
  formVersion: FORM_VERSION,
  schoolId: 'school-1',
  schoolName: 'Riverside High',
  cannotFindSchool: false,
  unlistedSchool: { name: '', city: '', state: '', website: '' },
  gradeLevel: '10th grade',
  responses: {},
}

describe('NTHS application draft storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('reads back what was saved for the same user', () => {
    setNTHSApplicationDraft('user-1', DRAFT)

    expect(getNTHSApplicationDraft('user-1')).toEqual(DRAFT)
  })

  it('never shows one user the draft another user saved', () => {
    setNTHSApplicationDraft('user-1', DRAFT)

    expect(getNTHSApplicationDraft('user-2')).toBeUndefined()
    expect(getNTHSApplicationDraft(undefined)).toBeUndefined()
  })

  it('saves nothing without a signed-in user', () => {
    setNTHSApplicationDraft(undefined, DRAFT)

    expect(localStorage.length).toBe(0)
  })

  it('removes only that user’s draft on clear', () => {
    setNTHSApplicationDraft('user-1', DRAFT)
    setNTHSApplicationDraft('user-2', DRAFT)

    clearNTHSApplicationDraft('user-1')

    expect(getNTHSApplicationDraft('user-1')).toBeUndefined()
    expect(getNTHSApplicationDraft('user-2')).toEqual(DRAFT)
  })

  it('reads a corrupt draft as no draft', () => {
    setNTHSApplicationDraft('user-1', DRAFT)
    localStorage.setItem(localStorage.key(0)!, '{not json')

    expect(getNTHSApplicationDraft('user-1')).toBeUndefined()
  })

  it.each(['getItem', 'setItem', 'removeItem'] as const)(
    'carries on when storage %s throws',
    (method) => {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })

      expect(() => {
        setNTHSApplicationDraft('user-1', DRAFT)
        getNTHSApplicationDraft('user-1')
        clearNTHSApplicationDraft('user-1')
      }).not.toThrow()
    }
  )
})
