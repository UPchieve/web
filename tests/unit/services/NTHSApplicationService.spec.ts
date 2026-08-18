import { describe, it, expect } from 'vitest'
import {
  buildEmptyResponses,
  collectResponses,
  NTHS_APPLICATION_QUESTIONS,
  HIGH_SCHOOL_GRADES,
} from '@/services/NTHSApplicationService'

describe('NTHS_APPLICATION_QUESTIONS', () => {
  it('has a unique key per question', () => {
    const keys = NTHS_APPLICATION_QUESTIONS.map((q) => q.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  // subway rejects any key its own form-version list does not carry, so a key
  // added here without the matching change there is a 422 at submit. Update
  // NTHS_APPLICATION_FORMS in subway alongside this list.
  it('matches the key set subway validates against for form version 1', () => {
    expect(NTHS_APPLICATION_QUESTIONS.map((q) => q.key)).toEqual([
      'whyStartChapter',
      'leadershipExperience',
      'recruitmentIdea',
      'motivatingCoaches',
      'commitWeeklyHours',
      'commitFoundingPresident',
      'commitMonthlyMeetings',
      'commitRecruitHighSchoolersOnly',
      'coPresidentEmail',
      'howDidYouHear',
    ])
  })

  it('marks only the two free-text extras optional', () => {
    const optional = NTHS_APPLICATION_QUESTIONS.filter(
      (q) => q.isRequired === false
    ).map((q) => q.key)
    expect(optional).toEqual(['coPresidentEmail', 'howDidYouHear'])
  })
})

describe('HIGH_SCHOOL_GRADES', () => {
  // The form submits grade.split(' ')[0], which has to land on the GRADES enum
  // subway validates with asEnum.
  it('reduces to the grade values the API accepts', () => {
    expect(HIGH_SCHOOL_GRADES.map((g) => g.split(' ')[0])).toEqual([
      '9th',
      '10th',
      '11th',
      '12th',
    ])
  })
})

describe('buildEmptyResponses', () => {
  it('starts attestations false and text empty', () => {
    const responses = buildEmptyResponses()

    expect(responses.commitWeeklyHours).toBe(false)
    expect(responses.whyStartChapter).toBe('')
    expect(Object.keys(responses)).toHaveLength(
      NTHS_APPLICATION_QUESTIONS.length
    )
  })
})

describe('collectResponses', () => {
  it('drops blank answers rather than sending them empty', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      whyStartChapter: 'To help my peers',
    })

    expect(collected).toEqual({ whyStartChapter: 'To help my peers' })
    expect('coPresidentEmail' in collected).toBe(false)
  })

  it('drops whitespace-only answers', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      whyStartChapter: '   ',
    })

    expect('whyStartChapter' in collected).toBe(false)
  })

  it('trims the answers it keeps', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      whyStartChapter: '  To help my peers  ',
    })

    expect(collected.whyStartChapter).toBe('To help my peers')
  })

  it('keeps checked attestations and drops unchecked ones', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      commitWeeklyHours: true,
    })

    expect(collected.commitWeeklyHours).toBe(true)
    // subway reads an absent attestation as unanswered rather than as a no, so
    // dropping the false ones cannot smuggle an application past its checks.
    expect('commitFoundingPresident' in collected).toBe(false)
  })

  it('ignores keys that are not part of the form', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      whyStartChapter: 'To help my peers',
      somethingElse: 'should not be sent',
    } as never)

    expect('somethingElse' in collected).toBe(false)
  })
})
