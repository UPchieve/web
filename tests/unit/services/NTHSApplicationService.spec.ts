import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  buildEmptyResponses,
  collectResponses,
  HIGH_SCHOOL_GRADES,
  NTHS_APPLICATION_QUESTIONS,
  sanitizeNTHSApplicationDraft,
  type NTHSApplicationDraft,
  type NTHSApplicationResponses,
  type NTHSQuestion,
  upcomingApplicationDeadline,
} from '@/services/NTHSApplicationService'
import { US_COUNTRY } from '@/consts'

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
      whyStartChapter: 'Recruit five tutors',
    })

    expect(collected).toEqual({ whyStartChapter: 'Recruit five tutors' })
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
      whyStartChapter: '  Recruit five tutors  ',
    })

    expect(collected.whyStartChapter).toBe('Recruit five tutors')
  })

  it('keeps checked attestations and drops unchecked ones', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      commitWeeklyHours: true,
    })

    expect(collected.commitWeeklyHours).toBe(true)
    // subway reads an absent attestation as unanswered rather than as a no, so
    // dropping the false ones cannot smuggle an application past its checks.
    expect('commitRecruitThreeTutors' in collected).toBe(false)
  })

  it('ignores keys that are not part of the form', () => {
    const collected = collectResponses({
      ...buildEmptyResponses(),
      whyStartChapter: 'Recruit five tutors',
      somethingElse: 'should not be sent',
    } as never)

    expect('somethingElse' in collected).toBe(false)
  })
})

describe('sanitizeNTHSApplicationDraft', () => {
  function answersFor(questions: NTHSQuestion[]): NTHSApplicationResponses {
    return questions.reduce((responses, question) => {
      responses[question.key] =
        question.type === 'attestation' ? true : `answer for ${question.key}`
      return responses
    }, {} as NTHSApplicationResponses)
  }

  function buildDraft(
    overrides: Partial<NTHSApplicationDraft> = {}
  ): NTHSApplicationDraft {
    return {
      schoolId: 'school-1',
      schoolName: 'Riverside High',
      cannotFindSchool: false,
      unlistedSchool: {
        name: '',
        city: '',
        country: 'Canada',
        state: '',
        region: 'Ontario',
        website: '',
      },
      gradeLevel: '10th grade',
      responses: answersFor(NTHS_APPLICATION_QUESTIONS),
      ...overrides,
    }
  }

  it('keeps a well-formed draft', () => {
    expect(sanitizeNTHSApplicationDraft(buildDraft())).toEqual(buildDraft())
  })

  it('drops answers the current form does not ask', () => {
    const draft = sanitizeNTHSApplicationDraft({
      ...buildDraft(),
      formVersion: 3,
      responses: {
        ...answersFor(NTHS_APPLICATION_QUESTIONS),
        notAQuestion: 'nope',
      },
    })

    expect(draft).not.toHaveProperty('formVersion')
    expect(draft?.responses).toEqual(answersFor(NTHS_APPLICATION_QUESTIONS))
  })

  it('drops fields with the wrong shape', () => {
    const answers = answersFor(NTHS_APPLICATION_QUESTIONS)
    const wrongTypes = Object.fromEntries(
      Object.entries(answers).map(([key, answer]) => [
        key,
        answer === true ? 'yes' : true,
      ])
    )

    const draft = sanitizeNTHSApplicationDraft(
      buildDraft({
        schoolId: null,
        cannotFindSchool: true,
        gradeLevel: 'College',
        responses: wrongTypes,
      })
    )

    expect(draft).toMatchObject({
      schoolName: '',
      cannotFindSchool: true,
      gradeLevel: '',
      responses: {},
    })
    expect(
      sanitizeNTHSApplicationDraft(buildDraft({ cannotFindSchool: true }))
        ?.cannotFindSchool
    ).toBe(false)
  })

  it.each([
    [
      'a state and an unknown country',
      { state: 'CA', country: 'Narnia' },
      US_COUNTRY,
    ],
    [
      'a state and a known country',
      { state: 'CA', country: 'Canada' },
      'Canada',
    ],
    ['no state and no country', { state: '' }, ''],
  ])(
    'reads the country of a draft with %s as %o',
    (_label, fields, country) => {
      const draft = sanitizeNTHSApplicationDraft(
        buildDraft({
          unlistedSchool: {
            name: 'Riverside High',
            city: 'Riverside',
            website: '',
            ...fields,
          } as never,
        })
      )

      expect(draft?.unlistedSchool.country).toBe(country)
    }
  )

  it.each([undefined, null, 'a string', 42])(
    'reads %s as no draft',
    (saved) => {
      expect(sanitizeNTHSApplicationDraft(saved)).toBeNull()
    }
  )
})

describe('upcomingApplicationDeadline', () => {
  const CLOSES_AT = new Date(2026, 8, 30, 23, 59).toISOString()

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['on the close date', new Date(2026, 8, 30, 12)],
    ['the day before', new Date(2026, 8, 29, 23, 59)],
    ['Sep 15', new Date(2026, 8, 15, 12)],
  ])('shows the close date %s', (_, now) => {
    vi.useFakeTimers().setSystemTime(now)
    expect(upcomingApplicationDeadline(CLOSES_AT)).toEqual({
      closesOn: 'Sep 30, 2026',
    })
  })

  it.each([
    ['all day', new Date(2026, 8, 30, 23, 59, 58), true],
    ['the next day', new Date(2026, 9, 1, 0, 0), false],
  ])('keeps a close date with no time open %s', (_, now, shown) => {
    vi.useFakeTimers().setSystemTime(now)
    expect(upcomingApplicationDeadline('2026-09-30')).toEqual(
      shown ? { closesOn: 'Sep 30, 2026' } : undefined
    )
  })

  it.each([
    ['no close date', undefined],
    ['a close date that is not a date', 'end of September'],
    ['a close date that is not a string', 1790000000000],
    ['a close date that has passed', CLOSES_AT],
  ])('shows nothing for %s', (_, closesAt) => {
    vi.useFakeTimers().setSystemTime(new Date(2026, 9, 1, 0, 0))
    expect(upcomingApplicationDeadline(closesAt)).toBeUndefined()
  })
})
