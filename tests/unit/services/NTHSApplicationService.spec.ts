import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  buildEmptyResponses,
  collectResponses,
  daysLeftToApply,
  HIGH_SCHOOL_GRADES,
  NTHS_APPLICATION_FORMS,
  sanitizeNTHSApplicationDraft,
  type NTHSApplicationDraft,
  type NTHSApplicationResponses,
  type NTHSFormVersion,
  type NTHSQuestion,
} from '@/services/NTHSApplicationService'

// A form-version-agnostic stand-in for a real NTHS_APPLICATION_FORMS entry:
// one required longText, one optional shortText, one attestation.
const TEST_QUESTIONS: NTHSQuestion[] = [
  {
    key: 'projectPlan',
    type: 'longText',
    label: 'What is your plan?',
    isRequired: true,
  },
  {
    key: 'mentorEmail',
    type: 'shortText',
    label: 'Mentor email (optional)',
    isRequired: false,
  },
  {
    key: 'willAttendOrientation',
    type: 'attestation',
    label: 'I will attend orientation',
  },
  {
    key: 'willSubmitReports',
    type: 'attestation',
    label: 'I will submit reports',
  },
]

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
    const responses = buildEmptyResponses(TEST_QUESTIONS)

    expect(responses.willAttendOrientation).toBe(false)
    expect(responses.projectPlan).toBe('')
    expect(Object.keys(responses)).toHaveLength(TEST_QUESTIONS.length)
  })
})

describe('collectResponses', () => {
  it('drops blank answers rather than sending them empty', () => {
    const collected = collectResponses(TEST_QUESTIONS, {
      ...buildEmptyResponses(TEST_QUESTIONS),
      projectPlan: 'Recruit five tutors',
    })

    expect(collected).toEqual({ projectPlan: 'Recruit five tutors' })
    expect('mentorEmail' in collected).toBe(false)
  })

  it('drops whitespace-only answers', () => {
    const collected = collectResponses(TEST_QUESTIONS, {
      ...buildEmptyResponses(TEST_QUESTIONS),
      projectPlan: '   ',
    })

    expect('projectPlan' in collected).toBe(false)
  })

  it('trims the answers it keeps', () => {
    const collected = collectResponses(TEST_QUESTIONS, {
      ...buildEmptyResponses(TEST_QUESTIONS),
      projectPlan: '  Recruit five tutors  ',
    })

    expect(collected.projectPlan).toBe('Recruit five tutors')
  })

  it('keeps checked attestations and drops unchecked ones', () => {
    const collected = collectResponses(TEST_QUESTIONS, {
      ...buildEmptyResponses(TEST_QUESTIONS),
      willAttendOrientation: true,
    })

    expect(collected.willAttendOrientation).toBe(true)
    // subway reads an absent attestation as unanswered rather than as a no, so
    // dropping the false ones cannot smuggle an application past its checks.
    expect('willSubmitReports' in collected).toBe(false)
  })

  it('ignores keys that are not part of the form', () => {
    const collected = collectResponses(TEST_QUESTIONS, {
      ...buildEmptyResponses(TEST_QUESTIONS),
      projectPlan: 'Recruit five tutors',
      somethingElse: 'should not be sent',
    } as never)

    expect('somethingElse' in collected).toBe(false)
  })
})

describe('sanitizeNTHSApplicationDraft', () => {
  // Derived from whichever form(s) NTHS_APPLICATION_FORMS currently defines, so
  // these tests don't care which form versions exist or which get deleted.
  const FORM_VERSIONS = Object.keys(NTHS_APPLICATION_FORMS).map(
    Number
  ) as NTHSFormVersion[]
  const FORM_VERSION = FORM_VERSIONS[0]
  const FORM_QUESTIONS = NTHS_APPLICATION_FORMS[FORM_VERSION]
  const UNKNOWN_FORM_VERSION = (Math.max(...FORM_VERSIONS) +
    1000) as NTHSFormVersion

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
      formVersion: FORM_VERSION,
      schoolId: 'school-1',
      schoolName: 'Riverside High',
      cannotFindSchool: false,
      unlistedSchool: { name: '', city: '', state: '', website: '' },
      gradeLevel: '10th grade',
      responses: answersFor(FORM_QUESTIONS),
      ...overrides,
    }
  }

  it('keeps a well-formed draft on the form version it was saved on', () => {
    // The fallback is an unknown version, so this only passes if the saved
    // (valid) version wins over it.
    expect(
      sanitizeNTHSApplicationDraft(buildDraft(), UNKNOWN_FORM_VERSION)
    ).toEqual(buildDraft())
  })

  it.each([undefined, UNKNOWN_FORM_VERSION])(
    'moves a draft saved on form version %s to the fallback form, dropping answers it does not ask',
    (formVersion) => {
      const draft = sanitizeNTHSApplicationDraft(
        buildDraft({
          formVersion: formVersion as never,
          responses: { ...answersFor(FORM_QUESTIONS), notAQuestion: 'nope' },
        }),
        FORM_VERSION
      )

      expect(draft?.formVersion).toBe(FORM_VERSION)
      expect(draft?.responses).toEqual(answersFor(FORM_QUESTIONS))
    }
  )

  it('drops fields with the wrong shape', () => {
    const answers = answersFor(FORM_QUESTIONS)
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
      }),
      FORM_VERSION
    )

    expect(draft).toMatchObject({
      schoolName: '',
      cannotFindSchool: true,
      gradeLevel: '',
      responses: {},
    })
    expect(
      sanitizeNTHSApplicationDraft(
        buildDraft({ cannotFindSchool: true }),
        FORM_VERSION
      )?.cannotFindSchool
    ).toBe(false)
  })

  it.each([undefined, null, 'a string', 42])(
    'reads %s as no draft',
    (saved) => {
      expect(sanitizeNTHSApplicationDraft(saved, FORM_VERSION)).toBeNull()
    }
  )
})

describe('daysLeftToApply', () => {
  const CLOSES_AT = new Date(2026, 8, 30, 23, 59).toISOString()

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['on the close date', 0, new Date(2026, 8, 30, 12)],
    ['the day before', 1, new Date(2026, 8, 29, 23, 59)],
    ['Sep 15', 15, new Date(2026, 8, 15, 12)],
    ['after the close date', 0, new Date(2026, 9, 2, 12)],
  ])('counts %s as %i', (_, days, now) => {
    vi.useFakeTimers().setSystemTime(now)
    expect(daysLeftToApply(CLOSES_AT)).toBe(days)
  })
})
